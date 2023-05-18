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
        logInfo(`No issue keys found in tags of scenario "${scenario.name}.`);
    } else if (issueKeys.length === 1) {
        return issueKeys[0];
    } else {
        logWarning(
            `Multiple issue keys found in tags of scenario "${scenario.name}": ` +
                `${issueKeys.join(", ")}`
        );
        logWarning(`The plugin will use the first one: ${issueKeys[0]}.`);
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
            issues[child.scenario.name] = issueTagOf(child.scenario, projectKey);
        }
    });
    return issues;
}
