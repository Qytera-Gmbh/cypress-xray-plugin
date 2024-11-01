import type { CypressRunResultType } from "../../types/cypress/cypress";
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
): boolean {
    return runResult.runs.some((run) => {
        if (featureFileExtension && run.spec.absolute.endsWith(featureFileExtension)) {
            return true;
        }
        return false;
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
        throw new Error(
            dedent(`
                Test: ${title}

                  No test issue keys found in title.

                  You can target existing test issues by adding a corresponding issue key:

                    it("${projectKey}-123 ${title}", () => {
                      // ...
                    });

                  For more information, visit:
                  - ${HELP.plugin.guides.targetingExistingIssues}
            `)
        );
    }
    const [key, ...keys] = matches;
    return [key, ...keys];
}
