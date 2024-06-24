import { GherkinDocument } from "@cucumber/messages";
import path from "path";
import { CypressRunResultType, TestResultType } from "../../../../../types/cypress/cypress";
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

interface Parameters {
    cucumber: Pick<InternalCucumberOptions, "featureFileExtension" | "prefixes">;
    jira: Pick<
        InternalJiraOptions,
        | "projectKey"
        | "testExecutionIssueDescription"
        | "testExecutionIssueSummary"
        | "testPlanIssueKey"
    >;
    projectRoot: string;
    useCloudTags?: boolean;
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
}

export class ConvertCucumberFeaturesCommand extends Command<
    CucumberMultipartFeature[],
    Parameters
> {
    private readonly cucumberResults: Computable<CucumberMultipartFeature[]>;
    private readonly cypressResults: Computable<CypressRunResultType>;
    private readonly gherkinDocuments: Computable<GherkinDocument>[];
    private readonly testExecutionIssueKey?: Computable<string | undefined>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        cucumberResults: Computable<CucumberMultipartFeature[]>,
        cypressResults: Computable<CypressRunResultType>,
        gherkinDocuments: Computable<GherkinDocument>[],
        testExecutionIssueKey?: Computable<string | undefined>
    ) {
        super(parameters, logger);
        this.cucumberResults = cucumberResults;
        this.cypressResults = cypressResults;
        this.gherkinDocuments = gherkinDocuments;
        this.testExecutionIssueKey = testExecutionIssueKey;
    }

    protected async computeResult(): Promise<CucumberMultipartFeature[]> {
        const input = await this.cucumberResults.compute();
        const cypressResults = await this.cypressResults.compute();
        const gherkinData: GherkinDocument[] = [];
        for (const document of this.gherkinDocuments) {
            try {
                gherkinData.push(await document.compute());
            } catch (error: unknown) {
                this.logger.message(
                    Level.WARNING,
                    dedent(`
                        Failed to scan feature file for results upload.

                          ${errorMessage(error)}
                    `)
                );
            }
        }
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
                        assertScenarioContainsIssueKey(
                            element,
                            this.parameters.jira.projectKey,
                            this.parameters.useCloudTags === true,
                            this.parameters.cucumber.prefixes.test
                        );
                        const modifiedElement: CucumberMultipartElement = {
                            ...element,
                            steps: getSteps(element, this.parameters.xray.uploadScreenshots),
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

    private getSkippedTests(
        cypressResults: CypressRunResultType,
        cucumberResults: CucumberMultipartFeature[],
        gherkinDocuments: GherkinDocument[]
    ): CucumberMultipartFeature[] {
        const skippedTests: TestResultType[] = [];
        for (const run of cypressResults.runs) {
            if (run.spec.absolute.endsWith(this.parameters.cucumber.featureFileExtension)) {
                for (const test of run.tests) {
                    if (
                        cucumberResults.every(
                            (element) => element.name !== test.title[test.title.length - 1]
                        )
                    ) {
                        skippedTests.push(test);
                    }
                }
            }
        }
        return [];
    }
}

function assertScenarioContainsIssueKey(
    element: CucumberMultipartElement,
    projectKey: string,
    isXrayCloud: boolean,
    testPrefix?: string
): void {
    const issueKeys: string[] = [];
    if (element.tags) {
        for (const tag of element.tags) {
            const matches = tag.name.match(getScenarioTagRegex(projectKey, testPrefix));
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
                isXrayCloud
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
            projectKey,
            isXrayCloud
        );
    }
}

function getSteps(
    element: CucumberMultipartElement,
    includeScreenshots?: boolean
): CucumberMultipartStep[] {
    const steps: CucumberMultipartStep[] = [];
    element.steps.forEach((step: CucumberMultipartStep) => {
        steps.push({
            ...step,
            embeddings: includeScreenshots ? step.embeddings : [],
        });
    });
    return steps;
}
