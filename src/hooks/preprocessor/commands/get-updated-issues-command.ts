import { ImportFeatureResponse } from "../../../types/xray/responses/import-feature";
import { dedent } from "../../../util/dedent";
import { HELP } from "../../../util/help";
import { Level, Logger } from "../../../util/logging";
import { computeOverlap } from "../../../util/set";
import { Command, Computable } from "../../command";

interface Parameters {
    filePath: string;
}

export class GetUpdatedIssuesCommand extends Command<string[], Parameters> {
    private readonly expectedAffectedIssues: Computable<string[]>;
    private readonly importResponse: Computable<ImportFeatureResponse>;

    constructor(
        parameters: Parameters,
        logger: Logger,
        expectedAffectedIssues: Computable<string[]>,
        importResponse: Computable<ImportFeatureResponse>
    ) {
        super(parameters, logger);
        this.expectedAffectedIssues = expectedAffectedIssues;
        this.importResponse = importResponse;
    }

    protected async computeResult(): Promise<string[]> {
        const expectedAffectedIssues = await this.expectedAffectedIssues.compute();
        const importResponse = await this.importResponse.compute();
        const setOverlap = computeOverlap(
            expectedAffectedIssues,
            importResponse.updatedOrCreatedIssues
        );
        if (setOverlap.leftOnly.length > 0 || setOverlap.rightOnly.length > 0) {
            const mismatchLinesFeatures: string[] = [];
            const mismatchLinesJira: string[] = [];
            if (setOverlap.leftOnly.length > 0) {
                mismatchLinesFeatures.push(
                    "Issues contained in feature file tags that have not been updated by Xray and may not exist:"
                );
                mismatchLinesFeatures.push("");
                mismatchLinesFeatures.push(
                    ...setOverlap.leftOnly.map((issueKey) => `  ${issueKey}`)
                );
            }
            if (setOverlap.rightOnly.length > 0) {
                mismatchLinesJira.push(
                    "Issues updated by Xray that do not exist in feature file tags and may have been created:"
                );
                mismatchLinesJira.push("");
                mismatchLinesJira.push(...setOverlap.rightOnly.map((issueKey) => `  ${issueKey}`));
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
            this.logger.message(
                Level.WARNING,
                dedent(`
                    ${this.parameters.filePath}

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
        return setOverlap.intersection;
    }
}
