import { CypressRunResultType, CypressTestResultType } from "../../types/cypress/run-result";
import {
    errorMessage,
    missingTestKeyInNativeTestTitleError,
    multipleTestKeysInNativeTestTitleError,
} from "../../util/errors";
import { LOG, Level } from "../../util/logging";

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

export function getNativeTestIssueKeys(
    results: CypressRunResultType,
    projectKey: string,
    featureFileExtension?: string
): string[] {
    const issueKeys: string[] = [];
    for (const runResult of results.runs) {
        const keyedTests: CypressTestResultType[] = [];
        // Cucumber tests aren't handled here. Let's skip them.
        if (featureFileExtension && runResult.spec.absolute.endsWith(featureFileExtension)) {
            continue;
        }
        for (let i = runResult.tests.length - 1; i >= 0; i--) {
            const testResult = runResult.tests[i];
            const title = testResult.title.join(" ");
            try {
                // The last element refers to an individual test (it).
                // The ones before are test suite titles (describe, context, ...).
                const issueKey = getNativeTestIssueKey(
                    testResult.title[testResult.title.length - 1],
                    projectKey
                );
                keyedTests.push(testResult);
                issueKeys.push(issueKey);
            } catch (error: unknown) {
                LOG.message(Level.WARNING, `Skipping test: ${title}\n\n${errorMessage(error)}`);
                runResult.tests.splice(i, 1);
            }
        }
    }
    return issueKeys;
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
