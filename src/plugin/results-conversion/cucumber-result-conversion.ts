import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
    CucumberMultipartElement,
    CucumberMultipartFeature,
    CucumberMultipartStep,
    CucumberMultipartTag,
} from "../../models/xray/requests/import-execution-cucumber-multipart";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { HELP } from "../../util/help";
import type { Logger } from "../../util/logging";
import { getScenarioTagRegex } from "../feature-file-processing/scenario";
import { getXrayStatus } from "./cucumber-status";

async function readCucumberReport(parameters: {
    cypress: {
        config: {
            projectRoot: string;
        };
    };
    options: {
        cucumber?: {
            reportPath?: string;
        };
    };
}) {
    if (!parameters.options.cucumber?.reportPath) {
        throw new Error(
            "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured."
        );
    }
    // Cypress might change process.cwd(), so we need to query the root directory.
    // See: https://github.com/cypress-io/cypress/issues/22689
    const reportPath = path.resolve(
        parameters.cypress.config.projectRoot,
        parameters.options.cucumber.reportPath
    );
    const fileContent = await readFile(reportPath, "utf-8");
    return JSON.parse(fileContent) as CucumberMultipartFeature[];
}

function convertCucumberFeatures(parameters: {
    cucumberResults: CucumberMultipartFeature[];
    cypress: { config: { projectRoot: string } };
    cypressResultExecutionIssueKey?: string;
    isCloudEnvironment: boolean;
    logger: Pick<Logger, "message">;
    options: {
        cucumber?: { prefixes?: { test?: string } };
        jira: { projectKey: string; testExecutionIssue?: { key?: string } };
        xray: {
            status?: {
                step?: { failed?: string; passed?: string; pending?: string; skipped?: string };
            };
            uploadScreenshots: boolean;
        };
    };
}) {
    let testExecutionIssueKey;
    if (parameters.cypressResultExecutionIssueKey) {
        testExecutionIssueKey = parameters.cypressResultExecutionIssueKey;
    } else {
        testExecutionIssueKey = parameters.options.jira.testExecutionIssue?.key;
    }
    const features: CucumberMultipartFeature[] = [];
    const errors: { element: CucumberMultipartElement; error: unknown; filePath: string }[] = [];
    for (const result of parameters.cucumberResults) {
        const test: CucumberMultipartFeature = {
            ...result,
        };
        if (testExecutionIssueKey) {
            const testExecutionIssueTag: CucumberMultipartTag = {
                name: `@${testExecutionIssueKey}`,
            };
            // Xray uses the first encountered issue tag for deducing the test execution issue.
            // Note: The tag is a feature tag, not a scenario tag!
            if (result.tags) {
                test.tags = [testExecutionIssueTag, ...result.tags];
            } else {
                test.tags = [testExecutionIssueTag];
            }
        }
        const elements: CucumberMultipartElement[] = [];
        for (const element of result.elements) {
            const filePath = path.resolve(parameters.cypress.config.projectRoot, result.uri);
            try {
                if (element.type === "scenario") {
                    assertScenarioContainsIssueKey({
                        element: element,
                        projectKey: parameters.options.jira.projectKey,
                        testPrefix: parameters.options.cucumber?.prefixes?.test,
                        useCloudTags: parameters.isCloudEnvironment,
                    });
                    const modifiedElement: CucumberMultipartElement = {
                        ...element,
                        steps: getSteps({
                            element: element,
                            uploadScreenshots: parameters.options.xray.uploadScreenshots,
                            xrayStepStatusOptions: parameters.options.xray.status?.step,
                        }),
                    };
                    elements.push(modifiedElement);
                }
            } catch (error: unknown) {
                errors.push({ element, error, filePath });
            }
        }
        if (elements.length > 0) {
            test.elements = elements;
            features.push(test);
        }
    }
    for (const { element, error, filePath } of errors) {
        const elementDescription = `${element.type[0].toUpperCase()}${element.type.substring(
            1
        )}: ${element.name.length > 0 ? element.name : "<no name>"}`;
        parameters.logger.message(
            "warning",
            dedent(`
                ${filePath}

                  ${elementDescription}

                    Skipping result upload.

                      Caused by: ${errorMessage(error)}
            `)
        );
    }
    return features;
}

function getSteps(parameters: {
    element: CucumberMultipartElement;
    uploadScreenshots: boolean;
    xrayStepStatusOptions?: {
        failed?: string;
        passed?: string;
        pending?: string;
        skipped?: string;
    };
}): CucumberMultipartStep[] {
    const steps: CucumberMultipartStep[] = [];
    parameters.element.steps.forEach((step: CucumberMultipartStep) => {
        steps.push({
            ...step,
            embeddings: parameters.uploadScreenshots ? step.embeddings : [],
            result: {
                ...step.result,
                status: getXrayStatus(step.result.status, parameters.xrayStepStatusOptions),
            },
        });
    });
    return steps;
}

function assertScenarioContainsIssueKey(parameters: {
    element: CucumberMultipartElement;
    projectKey: string;
    testPrefix?: string;
    useCloudTags?: boolean;
}): void {
    const issueKeys: string[] = [];
    if (parameters.element.tags) {
        for (const tag of parameters.element.tags) {
            const matches = tag.name.match(
                getScenarioTagRegex(parameters.projectKey, parameters.testPrefix)
            );
            if (!matches) {
                continue;
            }
            // We know the regex: the match will contain the value in the first group.
            issueKeys.push(matches[1]);
        }
    }
    if (issueKeys.length === 0) {
        const steps = parameters.element.steps.map((step: CucumberMultipartStep) => {
            return { keyword: step.keyword, text: step.name };
        });
        const firstStepLine =
            steps.length > 0 ? `${steps[0].keyword.trim()} ${steps[0].text}` : "Given A step";
        if (parameters.element.tags && parameters.element.tags.length > 0) {
            throw new Error(
                dedent(`
                    Scenario: ${parameters.element.name.length > 0 ? parameters.element.name : "<no name>"}

                      No test issue keys found in tags:

                        ${parameters.element.tags.map((tag) => tag.name).join("\n")}

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

                          @TestName:${parameters.projectKey}-123
                          ${parameters.element.keyword}: ${parameters.element.name}
                            ${firstStepLine}
                            ...

                      For more information, visit:
                      - ${HELP.plugin.guides.targetingExistingIssues}
                      - ${HELP.plugin.configuration.cucumber.prefixes}
                      - ${
                          parameters.useCloudTags
                              ? HELP.xray.importCucumberTests.cloud
                              : HELP.xray.importCucumberTests.server
                      }
                `)
            );
        }
        throw new Error(
            dedent(`
                Scenario: ${parameters.element.name.length > 0 ? parameters.element.name : "<no name>"}

                  No test issue keys found in tags.

                  You can target existing test issues by adding a corresponding tag:

                    @${parameters.projectKey}-123
                    ${parameters.element.keyword}: ${parameters.element.name}
                      ${firstStepLine}
                      ...

                  You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                    Plugin configuration:

                      {
                        cucumber: {
                          prefixes: {
                            test: "TestName:"
                          }
                        }
                      }

                    Feature file:

                      @TestName:${parameters.projectKey}-123
                      ${parameters.element.keyword}: ${parameters.element.name}
                        ${firstStepLine}
                        ...

                  For more information, visit:
                  - ${HELP.plugin.guides.targetingExistingIssues}
                  - ${HELP.plugin.configuration.cucumber.prefixes}
                  - ${
                      parameters.useCloudTags
                          ? HELP.xray.importCucumberTests.cloud
                          : HELP.xray.importCucumberTests.server
                  }
            `)
        );
    }
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { convertCucumberFeatures, readCucumberReport };
