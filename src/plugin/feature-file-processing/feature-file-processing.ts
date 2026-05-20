import type { Background, Comment, Scenario } from "@cucumber/messages";
import type { CucumberOptions } from "../../models/plugin";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { HELP } from "../../util/help";
import type { Logger } from "../../util/logging";
import { parseFeatureFile } from "./gherkin";
import {
    getCucumberPreconditionIssueComments,
    getCucumberPreconditionIssueTags,
} from "./precondition";
import { getCucumberScenarioIssueTags } from "./scenario";

export interface FeatureFileData {
    allIssueKeys: string[];
    backgrounds: {
        multipleIssueKeys: {
            background: Background;
            comments: readonly Comment[];
            issueKeys: readonly string[];
        }[];
        withoutIssueKeys: { background: Background; comments: readonly Comment[] }[];
    };
    filePath: string;
    scenarios: {
        multipleIssueKeys: {
            issueKeys: readonly string[];
            scenario: Scenario;
            tags: readonly { name: string }[];
        }[];
        withoutIssueKeys: Scenario[];
    };
}

function processFeatureFiles(parameters: {
    displayCloudHelp: boolean;
    featureFilePaths: Iterable<string>;
    logger: Pick<Logger, "message">;
    options: {
        cucumber: {
            prefixes?: {
                precondition?: string;
                test?: string;
            };
        };
        jira: {
            projectKey: string;
        };
    };
}) {
    const parsedFeatureFiles: FeatureFileData[] = [];
    for (const featureFilePath of parameters.featureFilePaths) {
        try {
            parsedFeatureFiles.push(
                processFeatureFile(
                    featureFilePath,
                    parameters.options.jira.projectKey,
                    parameters.options.cucumber.prefixes
                )
            );
        } catch (error: unknown) {
            parameters.logger.message(
                "error",
                dedent(`
                    ${featureFilePath}

                      Failed to parse feature file:

                        ${errorMessage(error)}
                `)
            );
        }
    }
    for (const data of parsedFeatureFiles) {
        for (const { background, comments } of data.backgrounds.withoutIssueKeys) {
            parameters.logger.message(
                "error",
                dedent(`
                    ${data.filePath}

                      Background: ${background.name.length > 0 ? background.name : "<no name>"}

                        No precondition issue keys found in comments:

                          ${comments.map((comment) => comment.text).join("\n")}

                        If a comment contains the precondition issue key already, specify a global prefix to align the plugin with Xray.

                          For example, with the following plugin configuration:

                            {
                              cucumber: {
                                prefixes: {
                                  precondition: "Precondition:"
                                }
                              }
                            }

                          The following comment will be recognized as a precondition issue tag by the plugin:

                            ${background.keyword}: ${background.name}
                              #@Precondition:${parameters.options.jira.projectKey}-123
                              ${
                                  background.steps.length > 0
                                      ? `${background.steps[0].keyword.trim()} ${background.steps[0].text}`
                                      : "Given A step"
                              }
                              ...

                        For more information, visit:
                        - ${HELP.plugin.guides.targetingExistingIssues}
                        - ${HELP.plugin.configuration.cucumber.prefixes}
                        - ${
                            parameters.displayCloudHelp
                                ? HELP.xray.importCucumberTests.cloud
                                : HELP.xray.importCucumberTests.server
                        }
                `)
            );
        }
        for (const { background, comments, issueKeys } of data.backgrounds.multipleIssueKeys) {
            parameters.logger.message(
                "error",
                dedent(`
                    ${data.filePath}

                      Background: ${background.name.length > 0 ? background.name : "<no name>"}

                        Multiple precondition issue keys found in the background's comments. Xray will only take one into account, you have to decide which one to use:

                          ${reconstructMultipleTagsBackground(background, issueKeys, comments)}

                        For more information, visit:
                        - ${
                            parameters.displayCloudHelp
                                ? HELP.xray.importCucumberTests.cloud
                                : HELP.xray.importCucumberTests.server
                        }
                        - ${HELP.plugin.guides.targetingExistingIssues}
                `)
            );
        }
        for (const scenario of data.scenarios.withoutIssueKeys) {
            parameters.logger.message(
                "error",
                dedent(`
                    ${data.filePath}

                      Scenario: ${scenario.name.length > 0 ? scenario.name : "<no name>"}

                        No test issue keys found in tags:

                          ${scenario.tags.map((tag) => tag.name).join("\n")}

                        If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray.

                          For example, with the following plugin configuration:

                            {
                              cucumber: {
                                prefixes: {
                                  test: "TestName:"
                                }
                              }
                            }

                          The following tag will be recognized as a test issue tag by the plugin:

                            @TestName:${parameters.options.jira.projectKey}-123
                            ${scenario.keyword}: ${scenario.name}
                              ${
                                  scenario.steps.length > 0
                                      ? `${scenario.steps[0].keyword.trim()} ${scenario.steps[0].text}`
                                      : "Given A step"
                              }
                              ...

                        For more information, visit:
                        - ${HELP.plugin.guides.targetingExistingIssues}
                        - ${HELP.plugin.configuration.cucumber.prefixes}
                        - ${
                            parameters.displayCloudHelp
                                ? HELP.xray.importCucumberTests.cloud
                                : HELP.xray.importCucumberTests.server
                        }
                  `)
            );
        }
        for (const { issueKeys, scenario, tags } of data.scenarios.multipleIssueKeys) {
            parameters.logger.message(
                "error",
                dedent(`
                    ${data.filePath}

                      Scenario: ${scenario.name.length > 0 ? scenario.name : "<no name>"}

                        Multiple test issue keys found in the scenario's tags. Xray will only take one into account, you have to decide which one to use:

                          ${tags.map((tag) => tag.name).join(" ")}
                          ${tags
                              .map((tag) => {
                                  if (issueKeys.some((key) => tag.name.endsWith(key))) {
                                      return "^".repeat(tag.name.length);
                                  }
                                  return " ".repeat(tag.name.length);
                              })
                              .join(" ")
                              .trimEnd()}
                          ${scenario.keyword}: ${scenario.name}
                            ${
                                scenario.steps.length > 0
                                    ? `${scenario.steps[0].keyword.trim()} ${scenario.steps[0].text}`
                                    : "Given A step"
                            }
                            ...

                        For more information, visit:
                        - ${
                            parameters.displayCloudHelp
                                ? HELP.xray.importCucumberTests.cloud
                                : HELP.xray.importCucumberTests.server
                        }
                        - ${HELP.plugin.guides.targetingExistingIssues}
                `)
            );
        }
    }
    return parsedFeatureFiles
        .filter(
            (data) =>
                data.backgrounds.multipleIssueKeys.length === 0 &&
                data.backgrounds.withoutIssueKeys.length === 0 &&
                data.scenarios.multipleIssueKeys.length === 0 &&
                data.scenarios.withoutIssueKeys.length === 0
        )
        .map((data) => {
            return { allIssueKeys: data.allIssueKeys, filePath: data.filePath };
        });
}

function processFeatureFile(
    filePath: string,
    projectKey: string,
    prefixes: Readonly<CucumberOptions["prefixes"]>
): FeatureFileData {
    const documentResult = parseFeatureFile(filePath);
    const featureFileData: FeatureFileData = {
        allIssueKeys: [],
        backgrounds: { multipleIssueKeys: [], withoutIssueKeys: [] },
        filePath: filePath,
        scenarios: { multipleIssueKeys: [], withoutIssueKeys: [] },
    };
    const backgrounds: Background[] = [];
    const scenarios: Scenario[] = [];
    if (documentResult.feature?.children) {
        for (const child of documentResult.feature.children) {
            if (child.scenario) {
                scenarios.push(child.scenario);
            }
            if (child.background) {
                backgrounds.push(child.background);
            }
            if (child.rule) {
                for (const ruleChild of child.rule.children) {
                    if (ruleChild.scenario) {
                        scenarios.push(ruleChild.scenario);
                    }
                    if (ruleChild.background) {
                        backgrounds.push(ruleChild.background);
                    }
                }
            }
        }
    }
    for (const background of backgrounds) {
        const preconditionComments = getCucumberPreconditionIssueComments(
            background,
            documentResult.comments
        ).map((comment) => {
            return { location: comment.location, text: comment.text.trim() };
        });
        const issueKeys = getCucumberPreconditionIssueTags(
            background,
            projectKey,
            preconditionComments,
            prefixes?.precondition
        );
        if (issueKeys.length === 0) {
            featureFileData.backgrounds.withoutIssueKeys.push({
                background: background,
                comments: preconditionComments,
            });
        } else if (issueKeys.length > 1) {
            featureFileData.backgrounds.multipleIssueKeys.push({
                background: background,
                comments: documentResult.comments,
                issueKeys: issueKeys,
            });
        } else {
            featureFileData.allIssueKeys.push(...issueKeys);
        }
    }
    for (const scenario of scenarios) {
        const issueKeys = getCucumberScenarioIssueTags(scenario, projectKey, prefixes?.test);
        if (issueKeys.length === 0) {
            featureFileData.scenarios.withoutIssueKeys.push(scenario);
        } else if (issueKeys.length > 1) {
            featureFileData.scenarios.multipleIssueKeys.push({
                issueKeys: issueKeys,
                scenario: scenario,
                tags: scenario.tags,
            });
        } else {
            featureFileData.allIssueKeys.push(...issueKeys);
        }
    }
    return featureFileData;
}

function reconstructMultipleTagsBackground(
    background: Background,
    preconditionIssueKeys: readonly string[],
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
    example.push(`  ${background.steps[0].keyword.trim()} ${background.steps[0].text}`);
    example.push("  ...");
    return example.join("\n");
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { processFeatureFiles };
