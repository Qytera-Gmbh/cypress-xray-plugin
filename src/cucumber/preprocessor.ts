import { Background, Comment, Scenario, Tag } from "@cucumber/messages";
import dedent from "dedent";
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
                throw new Error(
                    dedent(`
                        No test issue keys found in tags of scenario: ${child.scenario.name}
                        You can target existing test issues by adding a corresponding tag:

                        ${getScenarioTag(options.jira.projectKey, isCloudClient)}
                        ${getScenarioLine(child.scenario)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            } else if (issueKeys.length > 1) {
                throw new Error(
                    dedent(`
                        Multiple test issue keys found in tags of scenario: ${child.scenario.name}
                        The plugin cannot decide for you which one to use:

                        ${getScenarioMultipleTagsLine(child.scenario)}
                        ${getScenarioMultipleTagsIndicatorLine(child.scenario, issueKeys)}
                        ${getScenarioLine(child.scenario)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            }
        } else if (child.background) {
            const preconditionKeys = getPreconditionIssueTags(
                child.background,
                options.jira.projectKey,
                document.comments
            );
            if (preconditionKeys.length === 0) {
                throw new Error(
                    dedent(`
                        No precondition issue keys found in comments of background: ${
                            child.background.name
                        }
                        You can target existing precondition issues by adding a corresponding comment:

                        ${getBackgroundLine(child.background)}
                          ${getBackgroundTag(options.jira.projectKey)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            } else if (preconditionKeys.length > 1) {
                const lines = [
                    `Multiple precondition issue keys found in comments of background: ${child.background.name}`,
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
                ];
                throw new Error(lines.join("\n"));
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
