import { Feature, FeatureChild, Scenario } from "@cucumber/messages";
import { logInfo, logWarning } from "../logging/logging";

function issueTagOf(scenario: Scenario, projectKey: string): string | undefined {
    // Xray cloud: @TestName:CYP-123
    // Xray server: @CYP-123
    const regex = new RegExp(`@(?:TestName:)?(${projectKey}-\\d+)`);
    const issueKeys: string[] = [];
    for (const tag of scenario.tags) {
        const matches = tag.name.match(regex);
        if (!matches) {
            continue;
        } else if (matches.length === 2) {
            // Element [0] is the entire matched string, element [1] the first captured group.
            issueKeys.push(matches[1]);
        }
    }
    if (issueKeys.length === 0) {
        logInfo(`No issue keys found in tags of scenario "${scenario.name}".`);
    } else if (issueKeys.length === 1) {
        return issueKeys[0];
    } else {
        logWarning(
            `Multiple issue keys found in tags of scenario "${scenario.name}": ${issueKeys.join(
                ", "
            )}. Issue reuse will not work for this scenario.`
        );
    }
    return undefined;
}

/**
 * Builds a mapping of scenarios titles to Xray issue keys based on the provided feature.
 *
 * @param feature the Gherkin feature object with all its data
 * @param projectKey the project keys to look out for
 * @returns an object mapping scenario titles to Xray issue keys
 *
 * @example
 *   // the following feature file:
 *
 *   'Feature: Logins'
 *
 *     '@PRJ-1234'
 *     'Scenario: Successful login'
 *        [...]
 *
 *     '@PRJ-9876'
 *     'Scenario: Unsuccessful login'
 *        [...]
 *
 *  const issues = issuesByScenario([...], 'PRJ');
 *  console.log(issues);
 *  // prints the following:
 *   {
 *     'Successful login': 'PRJ-1234',
 *     'Unsuccessful login': 'PRJ-9876',
 *   }
 */
export function issuesByScenario(feature: Feature, projectKey: string): { [key: string]: string } {
    const issues: { [key: string]: string } = {};
    feature.children.map((child: FeatureChild) => {
        if (child.scenario) {
            const scenario = child.scenario;
            const issueKey = issueTagOf(scenario, projectKey);
            if (!issueKey) {
                return;
            }
            issues[scenario.name] = issueKey;
            const exampleCount = scenario.examples.flatMap((examples) => examples.tableBody).length;
            for (let i = 0; i < exampleCount; i++) {
                // The Cucumber preprocessor plugin appends '(example #...)' to every example run:
                // https://github.com/badeball/cypress-cucumber-preprocessor/blob/3c4f85de4d5ef1e2a339cdfd462f64e3cd606e48/lib/browser-runtime.ts#L260
                const exampleTitle = `${scenario.name} (example #${i + 1})`;
                issues[exampleTitle] = issueKey;
            }
        }
    });
    return issues;
}
