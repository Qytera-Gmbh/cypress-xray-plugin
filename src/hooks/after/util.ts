import { CypressRunResultType } from "../../types/cypress/run-result";
import { dedent } from "../../util/dedent";
import { HELP } from "../../util/help";

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
): featureFileExtension is string {
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
        throw new Error(
            dedent(`
                No test issue keys found in title of test: ${title}
                You can target existing test issues by adding a corresponding issue key:

                it("${projectKey}-123 ${title}", () => {
                  // ...
                });

                For more information, visit:
                - ${HELP.plugin.guides.targetingExistingIssues}
            `)
        );
    } else if (matches.length === 1) {
        return matches[0];
    } else {
        // Remove any circumflexes currently present in the title.
        let indicatorLine = title.replaceAll("^", " ");
        matches.forEach((issueKey: string) => {
            indicatorLine = indicatorLine.replaceAll(issueKey, "^".repeat(issueKey.length));
        });
        // Replace everything but circumflexes with space.
        indicatorLine = indicatorLine.replaceAll(/[^^]/g, " ");
        throw new Error(
            dedent(`
                Multiple test keys found in title of test: ${title}
                The plugin cannot decide for you which one to use:

                it("${title}", () => {
                    ${indicatorLine}
                  // ...
                });

                For more information, visit:
                - ${HELP.plugin.guides.targetingExistingIssues}
            `)
        );
    }
}
