import { Background, Comment, Scenario, Tag } from "@cucumber/messages";
import { logWarning } from "../logging/logging";
import { InternalOptions } from "../types/plugin";
import { getPreconditionIssueTags, getTestIssueTags, parseFeatureFile } from "./tagging";

export function preprocessFeatureFile(
    filePath: string,
    options: InternalOptions,
    isCloudClient: boolean
) {
    const document = parseFeatureFile(filePath);
    for (const child of document.feature.children) {
        if (child.scenario) {
            const issueKeys = getTestIssueTags(child.scenario, options.jira.projectKey);
            if (issueKeys.length === 0) {
                if (!options.jira.createTestIssues) {
                    throw new Error(
                        `Plugin is not allowed to create test issues for scenarios, but no test issue keys were found in tags of scenario: ${child.scenario.name}\n` +
                            "You can target existing test issues by adding a corresponding tag:\n" +
                            "\n" +
                            `${constructTaggedScenario(
                                child.scenario,
                                options.jira.projectKey,
                                isCloudClient
                            )}\n` +
                            "\n" +
                            `For more information, visit: ${getHelpUrl(isCloudClient)}`
                    );
                }
            }
            if (issueKeys.length > 1) {
                if (!options.jira.createTestIssues) {
                    throw new Error(
                        `Plugin is not allowed to create test issues for scenarios, but multiple test issue keys were found in tags of scenario: ${child.scenario.name}\n` +
                            "The plugin cannot decide for you which one to use:\n" +
                            "\n" +
                            `${reconstructMultipleTagsScenario(child.scenario, issueKeys)}\n` +
                            "\n" +
                            `For more information, visit: ${getHelpUrl(isCloudClient)}`
                    );
                } else {
                    logWarning(
                        `Multiple test issue keys found in scenario tags: ${issueKeys.join(", ")}.`,
                        "Issue reuse might not work for this test issue"
                    );
                }
            }
        } else if (child.background) {
            const preconditionKeys = getPreconditionIssueTags(
                child.background,
                options.jira.projectKey,
                document.comments
            );
            if (preconditionKeys.length === 0) {
                if (!options.jira.createTestIssues) {
                    throw new Error(
                        `Plugin is not allowed to create precondition issues for backgrounds, but no precondition issue keys were found in comments of background: ${child.background.name}\n` +
                            "You can target existing precondition issues by adding a corresponding comment:\n" +
                            "\n" +
                            `${constructTaggedBackground(
                                child.background,
                                options.jira.projectKey
                            )}\n` +
                            "\n" +
                            `For more information, visit: ${getHelpUrl(isCloudClient)}`
                    );
                }
            } else if (preconditionKeys.length > 1) {
                if (!options.jira.createTestIssues) {
                    throw new Error(
                        `Plugin is not allowed to create precondition issues for backgrounds, but multiple precondition issue keys were found in comments of background: ${child.background.name}\n` +
                            "The plugin cannot decide for you which one to use:\n" +
                            "\n" +
                            `${reconstructMultipleTagsBackground(
                                child.background,
                                preconditionKeys,
                                document.comments
                            )}\n` +
                            "\n" +
                            `For more information, visit: ${getHelpUrl(isCloudClient)}`
                    );
                } else {
                    logWarning(
                        `Multiple precondition issue keys found in background comments: ${preconditionKeys.join(
                            ", "
                        )}.`,
                        "Issue reuse might not work for this precondition"
                    );
                }
            }
        }
    }
}

function getHelpUrl(isCloudClient: boolean): string {
    return isCloudClient
        ? "https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2"
        : "https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST";
}

function constructTaggedScenario(
    scenario: Scenario,
    projectKey: string,
    isCloudClient: boolean
): string {
    const tag = isCloudClient ? `@TestName:${projectKey}-123` : `@${projectKey}-123`;
    return `${tag}\n` + `${scenario.keyword}: ${scenario.name}\n` + "  # steps ...";
}

function reconstructMultipleTagsScenario(scenario: Scenario, issueKeys: string[]): string {
    const tagLine = scenario.tags.map((tag: Tag) => tag.name).join(" ");
    const indicatorLine = scenario.tags
        .map((tag: Tag) => {
            if (issueKeys.some((key) => tag.name.endsWith(key))) {
                return tag.name.replaceAll(/./g, "^");
            }
            return tag.name.replaceAll(/./g, " ");
        })
        .join(" ")
        .trimEnd();
    return (
        `${tagLine}\n` +
        `${indicatorLine}\n` +
        `${scenario.keyword}: ${scenario.name}\n` +
        "  # steps ..."
    );
}

function constructTaggedBackground(background: Background, projectKey: string): string {
    return (
        `${background.keyword}: ${background.name}\n` +
        `  #@Precondition:${projectKey}-123\n` +
        "  # steps ..."
    );
}

function reconstructMultipleTagsBackground(
    background: Background,
    preconditionIssueKeys: string[],
    comments: readonly Comment[]
): string {
    const example: string[] = [];
    const backgroundLine = background.location.line;
    const firstStepLine = background.steps[0].location.line;
    example.push(`${background.keyword}: ${background.name}`);
    for (const comment of comments) {
        if (comment.location.line > backgroundLine && comment.location.line < firstStepLine) {
            example.push(`  ${comment.text.trimStart()}`);
            if (preconditionIssueKeys.some((key: string) => comment.text.endsWith(key))) {
                example.push(`  ${comment.text.replaceAll(/\S/g, "^").trimStart()}`);
            }
        }
    }
    example.push("  # steps ...");
    return example.join("\n");
}
