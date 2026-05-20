import type { HasImportFeatureEndpoint } from "../../client/xray/xray-client";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { HELP } from "../../util/help";
import type { Logger } from "../../util/logging";
import { computeOverlap } from "../../util/set";
import type { FeatureFileData } from "../feature-file-processing/feature-file-processing";

async function uploadFeatureFiles(parameters: {
    clients: { xray: HasImportFeatureEndpoint };
    logger: Pick<Logger, "message">;
    options: {
        jira: {
            projectKey: string;
        };
    };
    processedFeatureFiles: Pick<FeatureFileData, "allIssueKeys" | "filePath">[];
}): Promise<string[]> {
    const uploadAttempts = await Promise.all(
        parameters.processedFeatureFiles.map((featureFile) =>
            importFeatureFile({
                featureFile: featureFile,
                logger: parameters.logger,
                projectKey: parameters.options.jira.projectKey,
                xrayClient: parameters.clients.xray,
            })
        )
    );
    for (const uploadAttempt of uploadAttempts.filter((attempt) => attempt.status === "failed")) {
        parameters.logger.message(
            "error",
            dedent(`
                Failed to upload feature file ${uploadAttempt.filePath}:

                  ${errorMessage(uploadAttempt.error)}
            `)
        );
    }
    const successfulUploads = uploadAttempts.filter((result) => result.status === "success");
    for (const brokenAttempt of successfulUploads.filter(
        (attempt) =>
            attempt.mismatches.onlyInFeatureFile.length > 0 ||
            attempt.mismatches.onlyInXray.length > 0
    )) {
        const mismatchLinesFeatures: string[] = [];
        const mismatchLinesJira: string[] = [];
        if (brokenAttempt.mismatches.onlyInFeatureFile.length > 0) {
            mismatchLinesFeatures.push(
                "Issues contained in feature file tags that have not been updated by Xray and may not exist:"
            );
            mismatchLinesFeatures.push("");
            mismatchLinesFeatures.push(
                ...brokenAttempt.mismatches.onlyInFeatureFile.map((issueKey) => `  ${issueKey}`)
            );
        }
        if (brokenAttempt.mismatches.onlyInXray.length > 0) {
            mismatchLinesJira.push(
                "Issues updated by Xray that do not exist in feature file tags and may have been created:"
            );
            mismatchLinesJira.push("");
            mismatchLinesJira.push(
                ...brokenAttempt.mismatches.onlyInXray.map((issueKey) => `  ${issueKey}`)
            );
        }
        let mismatchLines: string;
        if (mismatchLinesFeatures.length > 0 && mismatchLinesJira.length > 0) {
            mismatchLines = dedent(`
                    ${mismatchLinesFeatures.join("\n")}

                    ${mismatchLinesJira.join("\n")}
                `);
        } else if (mismatchLinesFeatures.length > 0) {
            mismatchLines = mismatchLinesFeatures.join("\n");
        } else {
            mismatchLines = mismatchLinesJira.join("\n");
        }
        parameters.logger.message(
            "warning",
            dedent(`
                ${brokenAttempt.filePath}

                  Mismatch between feature file issue tags and updated Jira issues detected.

                    ${mismatchLines}

                  Make sure that:
                  - All issues present in feature file tags belong to existing issues.
                  - Your plugin tag prefix settings match those defined in Xray.

                  More information:
                  - ${HELP.plugin.guides.targetingExistingIssues}
                  - ${HELP.plugin.configuration.cucumber.prefixes}
            `)
        );
    }
    return successfulUploads.flatMap((attempt) => attempt.affectedIssues);
}

async function importFeatureFile(parameters: {
    featureFile: { allIssueKeys: string[]; filePath: string };
    logger: Pick<Logger, "message">;
    projectKey: string;
    xrayClient: HasImportFeatureEndpoint;
}) {
    const [importResult] = await Promise.allSettled([
        parameters.xrayClient.importFeature(parameters.featureFile.filePath, {
            projectKey: parameters.projectKey,
        }),
    ]);
    if (importResult.status === "rejected") {
        return {
            error: importResult.reason as unknown,
            filePath: parameters.featureFile.filePath,
            status: "failed",
        } as const;
    }
    if (importResult.value.errors.length > 0) {
        parameters.logger.message(
            "warning",
            dedent(`
                ${parameters.featureFile.filePath}

                  Encountered errors during feature file import:
                  ${importResult.value.errors.map((error) => `- ${error}`).join("\n")}
            `)
        );
    }
    const overlap = computeOverlap(
        parameters.featureFile.allIssueKeys,
        importResult.value.updatedOrCreatedIssues
    );
    return {
        affectedIssues: overlap.intersection,
        filePath: parameters.featureFile.filePath,
        mismatches: { onlyInFeatureFile: overlap.leftOnly, onlyInXray: overlap.rightOnly },
        status: "success",
    } as const;
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { uploadFeatureFiles };
