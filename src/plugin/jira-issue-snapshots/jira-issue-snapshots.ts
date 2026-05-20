import type { HasEditIssueEndpoint, HasSearchEndpoint } from "../../client/jira/jira-client";
import type { Issue } from "../../models/jira/responses/issue";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { extractArrayOfStrings, extractString } from "../../util/extraction";
import type { Logger } from "../../util/logging";

export interface JiraSnapshot {
    errorMessages: string[];
    issues: Required<Readonly<IssueSnapshot>>[];
}

interface IssueSnapshot {
    key: string;
    labels?: string[];
    summary?: string;
}

async function getIssueSnapshots(parameters: {
    client: HasSearchEndpoint;
    issues: IssueSnapshot[];
}): Promise<JiraSnapshot> {
    const snapshot: JiraSnapshot = { errorMessages: [], issues: [] };
    const incompleteIssues: IssueSnapshot[] = [];
    for (const issue of parameters.issues) {
        if (issue.labels !== undefined && issue.summary !== undefined) {
            snapshot.issues.push({
                key: issue.key,
                labels: issue.labels,
                summary: issue.summary,
            });
        } else {
            incompleteIssues.push(issue);
        }
    }
    if (incompleteIssues.length === 0) {
        return snapshot;
    }
    const jiraIssues: Issue[] = await parameters.client.search({
        fields: ["summary", "labels"],
        jql: `issue in (${incompleteIssues.map((issue) => issue.key).join(",")})`,
    });
    for (const issue of jiraIssues) {
        if (!issue.key) {
            snapshot.errorMessages.push(`Jira returned an unknown issue: ${JSON.stringify(issue)}`);
            continue;
        }
        const [summaryAttempt, labelsAttempt] = await Promise.allSettled([
            Promise.resolve().then(() => extractString(issue.fields, "summary")),
            Promise.resolve().then(() => extractArrayOfStrings(issue.fields, "labels")),
        ]);
        if (summaryAttempt.status === "rejected") {
            snapshot.errorMessages.push(`${issue.key}: ${errorMessage(summaryAttempt.reason)}`);
        }
        if (labelsAttempt.status === "rejected") {
            snapshot.errorMessages.push(`${issue.key}: ${errorMessage(labelsAttempt.reason)}`);
        }
        if (summaryAttempt.status === "rejected" || labelsAttempt.status === "rejected") {
            continue;
        }
        snapshot.issues.push({
            key: issue.key,
            labels: labelsAttempt.value,
            summary: summaryAttempt.value,
        });
    }
    return snapshot;
}

async function restoreIssueSnapshots(parameters: {
    client: HasEditIssueEndpoint;
    logger: Pick<Logger, "message">;
    newData: Required<IssueSnapshot>[];
    previousData: Required<IssueSnapshot>[];
}) {
    const { issuesToRestore, unrecoverableIssues } = computeIssuesToRestore({
        logger: parameters.logger,
        newData: parameters.newData,
        previousData: parameters.previousData,
    });
    for (const issue of unrecoverableIssues) {
        parameters.logger.message(
            "warning",
            dedent(`
                ${issue.key}

                  The plugin tried to reset the issue data after importing the feature files, but could not because the no backup data could be retrieved.

                  Make sure to manually restore it if needed.
            `)
        );
    }
    for (const issue of issuesToRestore) {
        try {
            await parameters.client.editIssue(issue.key, {
                fields: {
                    labels: issue.labels,
                    summary: issue.summary,
                },
            });
        } catch (error: unknown) {
            parameters.logger.message(
                "warning",
                dedent(`
                    Failed to restore backed up Jira issue data for ${issue.key}:

                      ${errorMessage(error)}
                `)
            );
        }
    }
}

function computeIssuesToRestore(parameters: {
    logger: Pick<Logger, "message">;
    newData: readonly Required<Readonly<IssueSnapshot>>[];
    previousData: readonly Required<Readonly<IssueSnapshot>>[];
}) {
    const issuesToRestore: Required<IssueSnapshot>[] = [];
    const unrecoverableIssues: Required<IssueSnapshot>[] = [];
    for (const newIssueData of parameters.newData) {
        const previousIssueData = parameters.previousData.find(
            (issue) => issue.key === newIssueData.key
        );
        if (previousIssueData === undefined) {
            unrecoverableIssues.push(newIssueData);
            continue;
        }
        const isSameSummary = previousIssueData.summary === newIssueData.summary;
        const areSameLabels =
            previousIssueData.labels.length === newIssueData.labels.length &&
            previousIssueData.labels.every((label) => newIssueData.labels.includes(label));
        if (isSameSummary && areSameLabels) {
            continue;
        }
        const issueToRestore = { ...newIssueData };
        if (!isSameSummary) {
            issueToRestore.summary = previousIssueData.summary;
        }
        if (!areSameLabels) {
            issueToRestore.labels = previousIssueData.labels;
        }
        issuesToRestore.push(issueToRestore);
    }
    return { issuesToRestore, unrecoverableIssues };
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { getIssueSnapshots, restoreIssueSnapshots };
