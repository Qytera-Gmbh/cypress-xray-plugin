import { Background, Comment, Scenario, Tag } from "@cucumber/messages";
import dedent from "dedent";
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
                        dedent(`
                        Plugin is not allowed to create test issues for scenarios, but no test issue keys were found in tags of scenario: ${
                            child.scenario.name
                        }
                        You can target existing test issues by adding a corresponding tag:

                        ${getScenarioTag(options.jira.projectKey, isCloudClient)}
                        ${getScenarioLine(child.scenario)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                        `)
                    );
                }
            }
            if (issueKeys.length > 1) {
                if (!options.jira.createTestIssues) {
                    throw new Error(
                        dedent(`
                        Plugin is not allowed to create test issues for scenarios, but multiple test issue keys were found in tags of scenario: ${
                            child.scenario.name
                        }
                        The plugin cannot decide for you which one to use:

                        ${getScenarioMultipleTagsLine(child.scenario)}
                        ${getScenarioMultipleTagsIndicatorLine(child.scenario, issueKeys)}
                        ${getScenarioLine(child.scenario)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                        `)
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
                        dedent(`
                        Plugin is not allowed to create precondition issues for backgrounds, but no precondition issue keys were found in comments of background: ${
                            child.background.name
                        }
                        You can target existing precondition issues by adding a corresponding comment:

                        ${getBackgroundLine(child.background)}
                          ${getBackgroundTag(options.jira.projectKey)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                        `)
                    );
                }
            } else if (preconditionKeys.length > 1) {
                if (!options.jira.createTestIssues) {
                    const lines = [
                        `Plugin is not allowed to create precondition issues for backgrounds, but multiple precondition issue keys were found in comments of background: ${child.background.name}`,
                        "The plugin cannot decide for you which one to use:",
                        "",
                        reconstructMultipleTagsBackground(
                            child.background,
                            preconditionKeys,
                            document.comments
                        ),
                        "",
                        "For more information, visit:",
                        `- ${getHelpUrl(isCloudClient)}`,
                        "- https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/",
                        "- https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues",
                    ];
                    throw new Error(lines.join("\n"));
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

function getScenarioLine(scenario: Scenario): string {
    return `${scenario.keyword}: ${scenario.name}`;
}

function getScenarioTag(projectKey: string, isCloudClient: boolean): string {
    return isCloudClient ? `@TestName:${projectKey}-123` : `@${projectKey}-123`;
}

function getScenarioMultipleTagsLine(scenario: Scenario): string {
    return scenario.tags.map((tag: Tag) => tag.name).join(" ");
}

function getScenarioMultipleTagsIndicatorLine(scenario: Scenario, issueKeys: string[]): string {
    const indicatorLine = scenario.tags
        .map((tag: Tag) => {
            if (issueKeys.some((key) => tag.name.endsWith(key))) {
                return "^".repeat(tag.name.length);
            }
            return " ".repeat(tag.name.length);
        })
        .join(" ")
        .trimEnd();
    return indicatorLine;
}

function getBackgroundLine(background: Background): string {
    return `${background.keyword}: ${background.name}`;
}

function getBackgroundTag(projectKey: string): string {
    return `#@Precondition:${projectKey}-123`;
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
