import { Background, Comment, GherkinDocument, Scenario } from "@cucumber/messages";
import { FeatureFileIssueData } from "../../../types/cucumber/cucumber";
import { CucumberOptions } from "../../../types/plugin";
import { dedent } from "../../../util/dedent";
import {
    missingTestKeyInCucumberScenarioError,
    multipleTestKeysInCucumberScenarioError,
} from "../../../util/errors";
import { HELP } from "../../../util/help";
import { Logger } from "../../../util/logging";
import { Command, Computable } from "../../command";
import {
    getCucumberPreconditionIssueComments,
    getCucumberPreconditionIssueTags,
} from "./parsing/precondition";
import { getCucumberScenarioIssueTags } from "./parsing/scenario";

interface Parameters {
    filePath: string;
    projectKey: string;
    prefixes: Readonly<CucumberOptions["prefixes"]>;
    displayCloudHelp: boolean;
}

export class ExtractFeatureFileIssuesCommand extends Command<FeatureFileIssueData, Parameters> {
    private readonly document: Computable<GherkinDocument>;
    constructor(parameters: Parameters, logger: Logger, document: Computable<GherkinDocument>) {
        super(parameters, logger);
        this.document = document;
    }

    protected async computeResult(): Promise<FeatureFileIssueData> {
        const parsedDocument = await this.document.compute();
        const featureFileIssueKeys: FeatureFileIssueData = {
            tests: [],
            preconditions: [],
        };
        const backgrounds: Background[] = [];
        const scenarios: Scenario[] = [];
        if (parsedDocument.feature?.children) {
            for (const child of parsedDocument.feature.children) {
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
                parsedDocument.comments
            );
            const preconditionKeys = getCucumberPreconditionIssueTags(
                background,
                this.parameters.projectKey,
                preconditionComments,
                this.parameters.prefixes?.precondition
            );
            if (preconditionKeys.length === 0) {
                const firstStepLine =
                    background.steps.length > 0
                        ? `${background.steps[0].keyword.trim()} ${background.steps[0].text}`
                        : "Given A step";
                if (preconditionComments.length > 0) {
                    throw new Error(
                        dedent(`
                            ${this.parameters.filePath}

                              Background: ${
                                  background.name.length > 0 ? background.name : "<no name>"
                              }

                                No precondition issue keys found in comments.

                                Available comments:

                                  ${preconditionComments.join("\n")}

                                If a comment contains the precondition issue key already, specify a global prefix to align the plugin with Xray

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
                                      #@Precondition:${this.parameters.projectKey}-123
                                      ${firstStepLine}
                                      ...

                                For more information, visit:
                                - ${HELP.plugin.guides.targetingExistingIssues}
                                - ${HELP.plugin.configuration.cucumber.prefixes}
                                - ${
                                    this.parameters.displayCloudHelp
                                        ? HELP.xray.importCucumberTests.cloud
                                        : HELP.xray.importCucumberTests.server
                                }
                        `)
                    );
                }
                throw new Error(
                    dedent(`
                        ${this.parameters.filePath}

                          Background: ${background.name.length > 0 ? background.name : "<no name>"}

                            No precondition issue keys found in comments.

                            You can target existing precondition issues by adding a corresponding comment:

                              ${background.keyword}: ${background.name}
                                #@${this.parameters.projectKey}-123
                                ${firstStepLine}
                                ...

                            You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                              Plugin configuration:

                                {
                                  cucumber: {
                                    prefixes: {
                                      precondition: "Precondition:"
                                    }
                                  }
                                }

                              Feature file:

                                ${background.keyword}: ${background.name}
                                  #@Precondition:${this.parameters.projectKey}-123
                                  ${firstStepLine}
                                  ...

                            For more information, visit:
                            - ${HELP.plugin.guides.targetingExistingIssues}
                            - ${HELP.plugin.configuration.cucumber.prefixes}
                            - ${
                                this.parameters.displayCloudHelp
                                    ? HELP.xray.importCucumberTests.cloud
                                    : HELP.xray.importCucumberTests.server
                            }
                    `)
                );
            } else if (preconditionKeys.length > 1) {
                throw new Error(
                    dedent(`
                        ${this.parameters.filePath}

                          Background: ${background.name.length > 0 ? background.name : "<no name>"}

                            Multiple precondition issue keys found in comments, the plugin cannot decide for you which one to use:

                              ${reconstructMultipleTagsBackground(
                                  background,
                                  preconditionKeys,
                                  parsedDocument.comments
                              )}

                            For more information, visit:
                            - ${
                                this.parameters.displayCloudHelp
                                    ? HELP.xray.importCucumberTests.cloud
                                    : HELP.xray.importCucumberTests.server
                            }
                            - ${HELP.plugin.guides.targetingExistingIssues}
                    `)
                );
            }
            featureFileIssueKeys.preconditions.push({
                key: preconditionKeys[0],
                summary: background.name,
            });
        }
        for (const scenario of scenarios) {
            const issueKeys = getCucumberScenarioIssueTags(
                scenario,
                this.parameters.projectKey,
                this.parameters.prefixes?.test
            );
            if (issueKeys.length === 0) {
                throw missingTestKeyInCucumberScenarioError(
                    scenario,
                    this.parameters.projectKey,
                    this.parameters.displayCloudHelp
                );
            } else if (issueKeys.length > 1) {
                throw multipleTestKeysInCucumberScenarioError(
                    scenario,
                    scenario.tags,
                    issueKeys,
                    this.parameters.displayCloudHelp
                );
            }
            featureFileIssueKeys.tests.push({
                key: issueKeys[0],
                summary: scenario.name,
                tags: scenario.tags.map((tag) => tag.name.replace("@", "")),
            });
        }
        return featureFileIssueKeys;
    }
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
