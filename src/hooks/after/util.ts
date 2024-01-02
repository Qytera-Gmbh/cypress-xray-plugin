import { CypressRunResultType } from "../../types/cypress/run-result";
import {
    missingTestKeyInNativeTestTitleError,
    multipleTestKeysInNativeTestTitleError,
} from "../../util/errors";

export function containsCypressTest(
    runResult: CypressRunResultType,
    featureFileExtension?: string
): boolean {
    return runResult.runs.some((run) => {
        if (featureFileExtension && run.spec.absolute.endsWith(featureFileExtension)) {
            return false;
        }
        return true;
    });
}

export function containsCucumberTest(
    runResult: CypressRunResultType,
    featureFileExtension?: string
): boolean {
    return runResult.runs.some((run) => {
        if (featureFileExtension && run.spec.absolute.endsWith(featureFileExtension)) {
            return true;
        }
        return false;
    });
}

/**
 * Extracts a Jira issue key from a native Cypress test title, based on the provided project key.
 *
 * @param title - the test title
 * @param projectKey - the Jira projectk key
 * @returns the Jira issue key
 * @throws if the title contains zero or more than one issue key
 */

export function getNativeTestIssueKey(title: string, projectKey: string): string {
    const regex = new RegExp(`(${projectKey}-\\d+)`, "g");
    const matches = title.match(regex);
    if (!matches) {
        throw missingTestKeyInNativeTestTitleError(title, projectKey);
    } else if (matches.length === 1) {
        return matches[0];
    } else {
        throw multipleTestKeysInNativeTestTitleError(title, matches);
    }
}
