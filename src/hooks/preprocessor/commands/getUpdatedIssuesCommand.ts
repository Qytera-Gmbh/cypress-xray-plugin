import { LOG, Level } from "../../../logging/logging";
import { ImportFeatureResponse } from "../../../types/xray/responses/importFeature";
import { dedent } from "../../../util/dedent";
import { HELP } from "../../../util/help";
import { computeOverlap } from "../../../util/set";
import { Command, Computable } from "../../command";

export class GetUpdatedIssuesCommand extends Command<string[]> {
    private readonly expectedAffectedIssues: Computable<string[]>;
    private readonly importResponse: Computable<ImportFeatureResponse>;

    constructor(
        expectedAffectedIssues: Computable<string[]>,
        importResponse: Computable<ImportFeatureResponse>
    ) {
        super();
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
                    "Issues contained in feature file tags which were not updated by Jira and might not exist:"
                );
                mismatchLinesFeatures.push(
                    ...setOverlap.leftOnly.map((issueKey) => `  ${issueKey}`)
                );
            }
            if (setOverlap.rightOnly.length > 0) {
                mismatchLinesJira.push(
                    "Issues updated by Jira which are not present in feature file tags and might have been created:"
                );
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
            LOG.message(
                Level.WARNING,
                dedent(`
                    Mismatch between feature file issue tags and updated Jira issues detected

                    ${mismatchLines}

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
