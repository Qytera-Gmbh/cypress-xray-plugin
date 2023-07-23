import { logWarning } from "./logging/logging";
import { getTestIssueKey } from "./tagging/cypress";
import { InternalOptions, Options } from "./types/plugin";

export function getNativeTestIssueKeys(
    results: CypressCommandLine.CypressRunResult,
    options: InternalOptions
): string[] {
    const issueKeys: string[] = [];
    for (const runResult of results.runs) {
        const keyedTests: CypressCommandLine.TestResult[] = [];
        // Cucumber tests aren't handled here. Let's skip them.
        if (
            options.cucumber &&
            runResult.spec.absolute.endsWith(options.cucumber.featureFileExtension)
        ) {
            continue;
        }
        for (const testResult of runResult.tests) {
            const title = testResult.title.join(" ");
            try {
                // The last element refers to an individual test (it).
                // The ones before are test suite titles (describe, context, ...).
                const issueKey = getTestIssueKey(
                    testResult.title[testResult.title.length - 1],
                    options.jira.projectKey
                );
                keyedTests.push(testResult);
                issueKeys.push(issueKey);
            } catch (error: unknown) {
                let reason = error;
                if (error instanceof Error) {
                    reason = error.message;
                }
                logWarning(`Skipping test: ${title}\n\n${reason}`);
            }
        }
        runResult.tests = keyedTests;
    }
    return issueKeys;
}

export function containsNativeTest(
    runResult: CypressCommandLine.CypressRunResult,
    options: Options
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (options.cucumber && run.spec.absolute.endsWith(options.cucumber.featureFileExtension)) {
            return false;
        }
        return true;
    });
}

export function containsCucumberTest(
    runResult: CypressCommandLine.CypressRunResult,
    options: Options
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (options.cucumber && run.spec.absolute.endsWith(options.cucumber.featureFileExtension)) {
            return true;
        }
        return false;
    });
}
