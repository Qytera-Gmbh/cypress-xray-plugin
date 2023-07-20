import { issuesByScenario } from "./cucumber/tagging";
import { logWarning } from "./logging/logging";
import { getTestIssueKey } from "./tagging/cypress";
import { InternalOptions } from "./types/plugin";
import { parseFeatureFile } from "./util/parsing";

export function processRunResult(
    results: CypressCommandLine.CypressRunResult,
    options: InternalOptions
): string[] {
    const issueKeys: string[] = [];
    for (const runResult of results.runs) {
        const keyedTests: CypressCommandLine.TestResult[] = [];
        // Cucumber tests aren't handled here. No need to process them.
        if (
            options.cucumber &&
            runResult.spec.absolute.endsWith(options.cucumber.featureFileExtension)
        ) {
            runResult.tests = [];
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

export function processFeatureFile(filePath: string, options: InternalOptions) {
    // Extract tag information for later use, e.g. when uploading test results to specific issues.
    const feature = parseFeatureFile(filePath).feature;
    options.cucumber.issues = {
        ...options.cucumber.issues,
        ...issuesByScenario(feature, options.jira.projectKey),
    };
}
