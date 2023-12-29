import fs from "fs";
import path from "path";
import { CombineCommand } from "../../commands/combineCommand";
import { Command, Computable, SkippedError } from "../../commands/command";
import { ConstantCommand } from "../../commands/constantCommand";
import { FunctionCommand } from "../../commands/functionCommand";
import { AttachFilesCommand } from "../../commands/jira/attachFilesCommand";
import { FetchIssueTypesCommand } from "../../commands/jira/fetchIssueTypesCommand";
import { JiraField } from "../../commands/jira/fields/extractFieldIdCommand";
import { ConvertCucumberFeaturesCommand } from "../../commands/plugin/conversion/cucumber/convertCucumberFeaturesCommand";
import {
    ConvertCucumberInfoCloudCommand,
    ConvertCucumberInfoCommand,
    ConvertCucumberInfoServerCommand,
} from "../../commands/plugin/conversion/cucumber/convertCucumberInfoCommand";
import { RunData } from "../../commands/plugin/conversion/cucumber/util/multipartInfo";
import { ConvertCypressInfoCommand } from "../../commands/plugin/conversion/cypress/convertCypressInfoCommand";
import { ConvertCypressTestsCommand } from "../../commands/plugin/conversion/cypress/convertCypressTestsCommand";
import { ImportExecutionCucumberCommand } from "../../commands/xray/importExecutionCucumberCommand";
import { ImportExecutionCypressCommand } from "../../commands/xray/importExecutionCypressCommand";
import { ImportFeatureCommand } from "../../commands/xray/importFeatureCommand";
import { LOG, Level } from "../../logging/logging";
import { containsCucumberTest, containsNativeTest } from "../../preprocessing/preprocessing";
import { IssueTypeDetails } from "../../types/jira/responses/issueTypeDetails";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { XrayTestExecutionResults } from "../../types/xray/importTestExecutionResults";
import {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "../../util/dedent";
import { ExecutableGraph } from "../../util/executable/executable";
import { HELP } from "../../util/help";
import { createExtractFieldIdCommand } from "../util";

export function addUploadCommands(
    runResult: CypressCommandLine.CypressRunResult,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): void {
    let importCypressExecutionCommand: ImportExecutionCypressCommand | null = null;
    let importCucumberExecutionCommand: ImportExecutionCucumberCommand | null = null;
    const resultsCommand = new ConstantCommand(runResult);
    if (containsNativeTest(runResult, options.cucumber?.featureFileExtension)) {
        const convertCypressTestsCommand = new ConvertCypressTestsCommand(
            { ...options, useCloudStatusFallback: clients.kind === "cloud" },
            resultsCommand
        );
        graph.connect(resultsCommand, convertCypressTestsCommand);
        const convertCypressInfoCommand = new ConvertCypressInfoCommand(options, resultsCommand);
        graph.connect(resultsCommand, convertCypressInfoCommand);
        const combineResultsJsonCommand = new CombineCommand(
            ([tests, info]): XrayTestExecutionResults => {
                return {
                    info: info,
                    tests: tests,
                    testExecutionKey: options.jira.testExecutionIssueKey,
                };
            },
            convertCypressTestsCommand,
            convertCypressInfoCommand
        );
        graph.connect(convertCypressTestsCommand, combineResultsJsonCommand);
        graph.connect(convertCypressInfoCommand, combineResultsJsonCommand);
        const assertConversionValidCommand = new FunctionCommand(
            (input: XrayTestExecutionResults) => {
                if (!input.tests || input.tests.length === 0) {
                    throw new SkippedError(
                        "No native Cypress tests were executed. Skipping native upload."
                    );
                }
            },
            combineResultsJsonCommand
        );
        graph.connect(combineResultsJsonCommand, assertConversionValidCommand);
        importCypressExecutionCommand = new ImportExecutionCypressCommand(
            clients.xrayClient,
            combineResultsJsonCommand
        );
        graph.connect(assertConversionValidCommand, importCypressExecutionCommand);
        if (options.jira.testExecutionIssueKey) {
            const compareIssueKeysCommand = new FunctionCommand((issueKey: string) => {
                if (issueKey !== options.jira.testExecutionIssueKey) {
                    LOG.message(
                        Level.WARNING,
                        dedent(`
                            Cypress execution results were imported to test execution ${issueKey}, which is different from the configured one: ${options.jira.testExecutionIssueKey}

                            Make sure issue ${options.jira.testExecutionIssueKey} actually exists and is of type: ${options.jira.testExecutionIssueType}
                        `)
                    );
                }
            }, importCypressExecutionCommand);
            graph.connect(importCypressExecutionCommand, compareIssueKeysCommand);
        }
    }
    if (containsCucumberTest(runResult, options.cucumber?.featureFileExtension)) {
        if (!options.cucumber?.preprocessor?.json.output) {
            throw new Error(
                "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured"
            );
        }
        const results: CucumberMultipartFeature[] = JSON.parse(
            fs.readFileSync(options.cucumber.preprocessor.json.output, "utf-8")
        ) as CucumberMultipartFeature[];
        const cucumberResultsCommand = new ConstantCommand(results);
        const extractExecutionIssueDetailsCommand = getTestExecutionIssueDetailsCommand(
            options,
            clients,
            graph
        );
        const convertCucumberInfoCommand = getConvertCucumberInfoCommand(
            options,
            clients,
            graph,
            extractExecutionIssueDetailsCommand,
            resultsCommand
        );
        graph.connect(extractExecutionIssueDetailsCommand, convertCucumberInfoCommand);
        graph.connect(resultsCommand, convertCucumberInfoCommand);
        const convertCucumberFeaturesCommand = new ConvertCucumberFeaturesCommand(
            { ...options, useCloudTags: clients.kind === "cloud" },
            cucumberResultsCommand
        );
        graph.connect(cucumberResultsCommand, convertCucumberFeaturesCommand);
        const combineCucumberMultipartCommand = new CombineCommand(
            ([info, features]): CucumberMultipart => {
                return {
                    info: info,
                    features: features,
                };
            },
            convertCucumberInfoCommand,
            convertCucumberFeaturesCommand
        );
        graph.connect(convertCucumberFeaturesCommand, combineCucumberMultipartCommand);
        graph.connect(convertCucumberInfoCommand, combineCucumberMultipartCommand);
        const assertConversionValidCommand = new FunctionCommand((input: CucumberMultipart) => {
            if (input.features.length === 0) {
                throw new SkippedError(
                    "No Cucumber tests were executed. Skipping Cucumber upload."
                );
            }
        }, combineCucumberMultipartCommand);
        graph.connect(combineCucumberMultipartCommand, assertConversionValidCommand);
        importCucumberExecutionCommand = new ImportExecutionCucumberCommand(
            clients.xrayClient,
            combineCucumberMultipartCommand
        );
        // Make sure to add an edge from any feature file imports to the execution. Otherwise, the
        // execution will contain old steps (those which were there prior to feature import).
        if (options.cucumber.uploadFeatures) {
            for (const command of graph.getVertices()) {
                if (command instanceof ImportFeatureCommand) {
                    if (
                        runResult.runs.some(
                            (run) =>
                                path.relative(projectRoot, run.spec.relative) ===
                                command.getFilePath()
                        )
                    ) {
                        // We can still upload results even if the feature file import fails. It's
                        // better to upload mismatched results than none at all.
                        graph.connect(command, importCucumberExecutionCommand, true);
                    }
                }
            }
        }
        graph.connect(combineCucumberMultipartCommand, importCucumberExecutionCommand);
        if (options.jira.testExecutionIssueKey) {
            const compareIssueKeysCommand = new FunctionCommand((issueKey: string) => {
                if (issueKey !== options.jira.testExecutionIssueKey) {
                    LOG.message(
                        Level.WARNING,
                        dedent(`
                            Cucumber execution results were imported to test execution ${issueKey}, which is different from the configured one: ${options.jira.testExecutionIssueKey}

                            Make sure issue ${options.jira.testExecutionIssueKey} actually exists and is of type: ${options.jira.testExecutionIssueType}
                        `)
                    );
                }
            }, importCucumberExecutionCommand);
            graph.connect(importCucumberExecutionCommand, compareIssueKeysCommand);
        }
    }
    // Retrieve the test execution issue key for further attachment uploads.
    let getExecutionIssueKeyCommand: Command<string>;
    if (importCypressExecutionCommand && importCucumberExecutionCommand) {
        getExecutionIssueKeyCommand = new CombineCommand(
            ([issueKeyCypress, issueKeyCucumber]) => {
                if (issueKeyCypress !== issueKeyCucumber) {
                    LOG.message(
                        Level.WARNING,
                        dedent(`
                            Cucumber execution results were imported to test execution issue ${issueKeyCucumber}, which is different than the one of the Cypress execution results: ${issueKeyCypress}

                            This might be a bug, please report it at: https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues
                        `)
                    );
                    return issueKeyCypress;
                }
                return issueKeyCypress;
            },
            importCypressExecutionCommand,
            importCucumberExecutionCommand
        );
        graph.connect(importCypressExecutionCommand, getExecutionIssueKeyCommand);
        graph.connect(importCucumberExecutionCommand, getExecutionIssueKeyCommand);
    } else if (importCypressExecutionCommand) {
        getExecutionIssueKeyCommand = importCypressExecutionCommand;
    } else if (importCucumberExecutionCommand) {
        getExecutionIssueKeyCommand = importCucumberExecutionCommand;
    } else {
        LOG.message(
            Level.WARNING,
            "Execution results import was skipped. Skipping remaining tasks"
        );
        return;
    }
    const printSuccessCommand = new FunctionCommand((issueKey: string) => {
        LOG.message(
            Level.SUCCESS,
            `Uploaded test results to issue: ${issueKey} (${options.jira.url}/browse/${issueKey})`
        );
    }, getExecutionIssueKeyCommand);
    graph.connect(getExecutionIssueKeyCommand, printSuccessCommand);
    if (options.jira.attachVideos) {
        const extractVideoFilesCommand = new CombineCommand(
            ([results, testExecutionIssueKey]) => {
                const videos = results.runs
                    .map((run: CypressCommandLine.RunResult) => {
                        return run.video;
                    })
                    .filter((value): value is string => typeof value === "string");
                if (videos.length === 0) {
                    throw new SkippedError(
                        `Skipping attaching videos to test execution issue ${testExecutionIssueKey}: No videos were captured`
                    );
                } else {
                    LOG.message(
                        Level.INFO,
                        `Attaching videos to text execution issue ${testExecutionIssueKey}`
                    );
                }
                return videos;
            },
            resultsCommand,
            getExecutionIssueKeyCommand
        );
        graph.connect(resultsCommand, extractVideoFilesCommand);
        graph.connect(getExecutionIssueKeyCommand, extractVideoFilesCommand);
        const attachVideosCommand = new AttachFilesCommand(
            clients.jiraClient,
            extractVideoFilesCommand,
            getExecutionIssueKeyCommand
        );
        graph.connect(extractVideoFilesCommand, attachVideosCommand);
        graph.connect(getExecutionIssueKeyCommand, attachVideosCommand);
    }
}

function getTestExecutionIssueDetailsCommand(
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): Command<IssueTypeDetails> {
    const fetchIssueTypesCommand = graph.findOrDefault(
        (command): command is FetchIssueTypesCommand => command instanceof FetchIssueTypesCommand,
        () => new FetchIssueTypesCommand(clients.jiraClient)
    );
    const getExecutionIssueDetailsCommand = new FunctionCommand(
        (issueDetails: IssueTypeDetails[]) => {
            const details = issueDetails.filter(
                (issueDetail) => issueDetail.name === options.jira.testExecutionIssueType
            );
            if (details.length === 0) {
                throw new Error(
                    dedent(`
                        Failed to retrieve issue type information for issue type: ${options.jira.testExecutionIssueType}

                        Make sure you have Xray installed.

                        For more information, visit:
                        - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                        - ${HELP.plugin.configuration.jira.testPlanIssueType}
                    `)
                );
            } else if (details.length > 1) {
                throw new Error(
                    dedent(`
                        Found multiple issue types named: ${options.jira.testExecutionIssueType}

                        Make sure to only make a single one available in project ${options.jira.projectKey}.

                        For more information, visit:
                        - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                        - ${HELP.plugin.configuration.jira.testPlanIssueType}
                    `)
                );
            }
            return details[0];
        },
        fetchIssueTypesCommand
    );
    graph.connect(fetchIssueTypesCommand, getExecutionIssueDetailsCommand);
    return getExecutionIssueDetailsCommand;
}

function getConvertCucumberInfoCommand(
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    executionIssueDetails: Computable<IssueTypeDetails>,
    results: Computable<RunData>
): ConvertCucumberInfoCommand {
    if (clients.kind === "cloud") {
        return new ConvertCucumberInfoCloudCommand(options, executionIssueDetails, results);
    }
    let testPlanIdCommand: Command<string> | undefined = undefined;
    let testEnvironmentsIdCommand: Command<string> | undefined = undefined;
    if (
        options.jira.testPlanIssueKey !== undefined ||
        options.xray.testEnvironments !== undefined
    ) {
        if (options.jira.testPlanIssueKey) {
            testPlanIdCommand = options.jira.fields.testPlan
                ? new ConstantCommand(options.jira.fields.testPlan)
                : createExtractFieldIdCommand(JiraField.TEST_PLAN, clients.jiraClient, graph);
        }
        if (options.xray.testEnvironments) {
            testEnvironmentsIdCommand = options.jira.fields.testEnvironments
                ? new ConstantCommand(options.jira.fields.testEnvironments)
                : createExtractFieldIdCommand(
                      JiraField.TEST_ENVIRONMENTS,
                      clients.jiraClient,
                      graph
                  );
        }
    }
    const convertCucumberInfoCommand = new ConvertCucumberInfoServerCommand(
        options,
        executionIssueDetails,
        results,
        { testPlanId: testPlanIdCommand, testEnvironmentsId: testEnvironmentsIdCommand }
    );
    if (testPlanIdCommand) {
        graph.connect(testPlanIdCommand, convertCucumberInfoCommand);
    }
    if (testEnvironmentsIdCommand) {
        graph.connect(testEnvironmentsIdCommand, convertCucumberInfoCommand);
    }
    return convertCucumberInfoCommand;
}
