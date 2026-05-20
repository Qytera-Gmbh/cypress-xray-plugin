import type { Scenario } from "@cucumber/messages";

export function getCucumberScenarioIssueTags(
    scenario: Scenario,
    projectKey: string,
    testPrefix?: string
): string[] {
    const issueKeys: string[] = [];
    for (const tag of scenario.tags) {
        const matches = tag.name.match(getScenarioTagRegex(projectKey, testPrefix));
        if (!matches) {
            continue;
        }
        // We know the regex: the match will contain the value in the first group.
        issueKeys.push(matches[1]);
    }
    return issueKeys;
}

export function getScenarioTagRegex(projectKey: string, testPrefix?: string) {
    if (testPrefix) {
        // @TestName:CYP-123
        return new RegExp(`@${testPrefix}(${projectKey}-\\d+)`);
    }
    // @CYP-123
    return new RegExp(`@(${projectKey}-\\d+)`);
}
