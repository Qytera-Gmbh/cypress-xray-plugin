import { LOG, Level } from "../../logging/logging";
import { FeatureFileIssueData } from "../../preprocessing/preprocessing";
import { StringMap } from "../../types/util";
import { ImportFeatureResponse } from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { HELP } from "../../util/help";
import { computeOverlap } from "../../util/set";
import { unknownToString } from "../../util/string";

export function gatherAllIssueKeys(issueData: FeatureFileIssueData): string[] {
    return [
        ...issueData.tests.map((data) => data.key),
        ...issueData.preconditions.map((data) => data.key),
    ];
}

export function getActualAffectedIssueKeys([expectedAffectedIssues, importResponse]: [
    string[],
    ImportFeatureResponse
]): string[] {
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
            mismatchLinesFeatures.push(...setOverlap.leftOnly.map((issueKey) => `  ${issueKey}`));
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

export function getSummariesToReset([oldValues, newValues]: [
    StringMap<string>,
    StringMap<string>
]): StringMap<string> {
    const toReset: StringMap<string> = {};
    for (const [issueKey, newSummary] of Object.entries(newValues)) {
        if (!(issueKey in oldValues)) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Skipping resetting summary of issue: ${issueKey}
                    The previous summary could not be fetched, make sure to manually restore it if needed
                `)
            );
            continue;
        }
        const oldSummary = oldValues[issueKey];
        if (oldSummary === newSummary) {
            LOG.message(
                Level.DEBUG,
                dedent(`
                    Skipping resetting summary of issue: ${issueKey}
                    The current summary is identical to the previous one:

                    Previous summary: ${unknownToString(oldSummary)}
                    Current summary:  ${unknownToString(newSummary)}
                `)
            );
            continue;
        }
        toReset[issueKey] = oldSummary;
    }
    return toReset;
}

export function getLabelsToReset([oldValues, newValues]: [
    StringMap<string[]>,
    StringMap<string[]>
]): StringMap<string[]> {
    const toReset: StringMap<string[]> = {};
    for (const [issueKey, newLabels] of Object.entries(newValues)) {
        if (!(issueKey in oldValues)) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Skipping resetting labels of issue: ${issueKey}
                    The previous labels could not be fetched, make sure to manually restore them if needed
                `)
            );
            continue;
        }
        const oldLabels = oldValues[issueKey];
        if (
            oldLabels.length === newLabels.length &&
            newLabels.every((label) => oldLabels.includes(label))
        ) {
            LOG.message(
                Level.DEBUG,
                dedent(`
                    Skipping resetting labels of issue: ${issueKey}
                    The current labels are identical to the previous ones:

                    Previous labels: ${unknownToString(oldLabels)}
                    Current labels:  ${unknownToString(newLabels)}
                `)
            );
            continue;
        }
        toReset[issueKey] = oldLabels;
    }
    return toReset;
}
