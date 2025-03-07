import type { CypressRunResultType } from "../../types/cypress/cypress";
import { missingTestKeyInTestTitleError } from "../../util/errors";

export function containsCypressTest(
    runResult: CypressRunResultType,
    featureFileExtension?: string
): boolean {
    return runResult.runs.some((run) => {
        return !featureFileExtension || !run.spec.absolute.endsWith(featureFileExtension);
    });
}

export function containsCucumberTest(
    runResult: CypressRunResultType,
    featureFileExtension?: string
): boolean {
    return runResult.runs.some((run) => {
        return featureFileExtension && run.spec.absolute.endsWith(featureFileExtension);
    });
}

/**
 * Extracts Jira issue keys from a Cypress test title, based on the provided project key.
 *
 * @param title - the test title
 * @param projectKey - the Jira projectk key
 * @returns the Jira issue keys
 * @throws if the title contains zero issue keys
 */

export function getTestIssueKeys(title: string, projectKey: string): [string, ...string[]] {
    const regex = new RegExp(`(${projectKey}-\\d+)`, "g");
    const matches = title.match(regex);
    if (!matches) {
        throw missingTestKeyInTestTitleError(title, projectKey);
    }
    const [key, ...keys] = matches;
    return [key, ...keys];
}
