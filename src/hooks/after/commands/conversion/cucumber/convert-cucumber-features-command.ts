import path from "path";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../../../types/plugin";
import {
    CucumberMultipartElement,
    CucumberMultipartFeature,
    CucumberMultipartStep,
    CucumberMultipartTag,
} from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { dedent } from "../../../../../util/dedent";
import {
    errorMessage,
    missingTestKeyInCucumberScenarioError,
    multipleTestKeysInCucumberScenarioError,
} from "../../../../../util/errors";
import { Level, Logger } from "../../../../../util/logging";
import { Command, Computable } from "../../../../command";
import { getScenarioTagRegex } from "../../../../preprocessor/commands/parsing/scenario";
import { getXrayStatus } from "./util/status";

interface Parameters {
    cucumber: Pick<InternalCucumberOptions, "prefixes">;
    jira: Pick<
        InternalJiraOptions,
        | "projectKey"
        | "testExecutionIssueDescription"
        | "testExecutionIssueSummary"
        | "testPlanIssueKey"
    >;
    projectRoot: string;
    useCloudTags?: boolean;
    xray: Pick<InternalXrayOptions, "status" | "testEnvironments" | "uploadScreenshots">;
}

export class ConvertCucumberFeaturesCommand extends Command<
    CucumberMultipartFeature[],
    Parameters
> {
    private readonly cucumberResults: Computable<CucumberMultipartFeature[]>;
    private readonly testExecutionIssueKey?: Computable<string | undefined>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        cucumberResults: Computable<CucumberMultipartFeature[]>,
        testExecutionIssueKey?: Computable<string | undefined>
    ) {
        super(parameters, logger);
        this.cucumberResults = cucumberResults;
        this.testExecutionIssueKey = testExecutionIssueKey;
    }

    protected async computeResult(): Promise<CucumberMultipartFeature[]> {
        const input = await this.cucumberResults.compute();
        const testExecutionIssueKey = await this.testExecutionIssueKey?.compute();
        const tests: CucumberMultipartFeature[] = [];
        for (const result of input) {
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
                const filepath = path.resolve(this.parameters.projectRoot, result.uri);
                try {
                    if (element.type === "scenario") {
                        this.assertScenarioContainsIssueKey(element);
                        const modifiedElement: CucumberMultipartElement = {
                            ...element,
                            steps: this.getSteps(element),
                        };
                        elements.push(modifiedElement);
                    }
                } catch (error: unknown) {
                    const elementDescription = `${element.type[0].toUpperCase()}${element.type.substring(
                        1
                    )}: ${element.name.length > 0 ? element.name : "<no name>"}`;
                    this.logger.message(
                        Level.WARNING,
                        dedent(`
                            ${filepath}

                              ${elementDescription}

                                Skipping result upload.

                                  Caused by: ${errorMessage(error)}
                        `)
                    );
                }
            }
            if (elements.length > 0) {
                test.elements = elements;
                tests.push(test);
            }
        }
        return tests;
    }

    private getSteps(element: CucumberMultipartElement): CucumberMultipartStep[] {
        const steps: CucumberMultipartStep[] = [];
        element.steps.forEach((step: CucumberMultipartStep) => {
            steps.push({
                ...step,
                embeddings: this.parameters.xray.uploadScreenshots ? step.embeddings : [],
                result: {
                    ...step.result,
                    status: getXrayStatus(step.result.status, this.parameters.xray.status.step),
                },
            });
        });
        return steps;
    }

    private assertScenarioContainsIssueKey(element: CucumberMultipartElement): void {
        const issueKeys: string[] = [];
        if (element.tags) {
            for (const tag of element.tags) {
                const matches = tag.name.match(
                    getScenarioTagRegex(
                        this.parameters.jira.projectKey,
                        this.parameters.cucumber.prefixes.test
                    )
                );
                if (!matches) {
                    continue;
                }
                // We know the regex: the match will contain the value in the first group.
                issueKeys.push(matches[1]);
            }
            if (issueKeys.length > 1) {
                throw multipleTestKeysInCucumberScenarioError(
                    {
                        keyword: element.keyword,
                        name: element.name,
                        steps: element.steps.map((step: CucumberMultipartStep) => {
                            return { keyword: step.keyword, text: step.name };
                        }),
                    },
                    element.tags,
                    issueKeys,
                    this.parameters.useCloudTags === true
                );
            }
        }
        if (issueKeys.length === 0) {
            throw missingTestKeyInCucumberScenarioError(
                {
                    keyword: element.keyword,
                    name: element.name,
                    steps: element.steps.map((step: CucumberMultipartStep) => {
                        return { keyword: step.keyword, text: step.name };
                    }),
                    tags: element.tags,
                },
                this.parameters.jira.projectKey,
                this.parameters.useCloudTags === true
            );
        }
    }
}
