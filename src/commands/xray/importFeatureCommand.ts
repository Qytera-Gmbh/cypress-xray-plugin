import { XrayClient } from "../../client/xray/xrayClient";
import { LOG, Level } from "../../logging/logging";
import { Command, Computable } from "../../util/command/command";
import { dedent } from "../../util/dedent";
import { HELP } from "../../util/help";
import { computeOverlap } from "../../util/set";

export interface ImportParameters {
    file: string;
    projectKey?: string;
    projectId?: string;
    source?: string;
}

export class ImportFeatureCommand extends Command<string[]> {
    constructor(
        private readonly xrayClient: XrayClient,
        private readonly importParameters: ImportParameters,
        private readonly expectedAffectedIssues: Computable<string[]>
    ) {
        super();
        this.xrayClient = xrayClient;
        this.importParameters = importParameters;
        this.expectedAffectedIssues = expectedAffectedIssues;
    }

    public getFilePath(): string {
        return this.importParameters.file;
    }

    public getProjectKey(): string | undefined {
        return this.importParameters.projectKey;
    }

    public getProjectId(): string | undefined {
        return this.importParameters.projectId;
    }

    public getSource(): string | undefined {
        return this.importParameters.source;
    }

    protected async computeResult(): Promise<string[]> {
        const expectedAffectedIssues = await this.expectedAffectedIssues.getResult();
        const importResponse = await this.xrayClient.importFeature(
            this.importParameters.file,
            this.importParameters.projectKey,
            this.importParameters.projectId,
            this.importParameters.source
        );
        if (importResponse.errors.length > 0) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Encountered errors during feature file import:
                    ${importResponse.errors.map((error) => `- ${error}`).join("\n")}
                `)
            );
        }
        const setOverlap = computeOverlap(
            expectedAffectedIssues,
            importResponse.updatedOrCreatedIssues
        );
        if (setOverlap.leftOnly.length > 0 || setOverlap.rightOnly.length > 0) {
            const mismatchLines: string[] = [];
            if (setOverlap.leftOnly.length > 0) {
                mismatchLines.push(
                    "Issues contained in feature file tags which were not updated by Jira and might not exist:"
                );
                mismatchLines.push(...setOverlap.leftOnly.map((issueKey) => `  ${issueKey}`));
            }
            if (setOverlap.rightOnly.length > 0) {
                mismatchLines.push(
                    "Issues updated by Jira which are not present in feature file tags and might have been created:"
                );
                mismatchLines.push(...setOverlap.rightOnly.map((issueKey) => `  ${issueKey}`));
            }
            LOG.message(
                Level.WARNING,
                dedent(`
                    Mismatch between feature file issue tags and updated Jira issues detected

                    ${mismatchLines.join("\n")}

                    Make sure that:
                    - All issues present in feature file tags belong to existing issues
                    - Your plugin tag prefix settings are consistent with the ones defined in Xray

                    More information:
                    - ${HELP.plugin.guides.targetingExistingIssues}
                    - ${HELP.plugin.configuration.cucumber.prefixes}
                `)
            );
        }
        return setOverlap.intersection;
    }
}
