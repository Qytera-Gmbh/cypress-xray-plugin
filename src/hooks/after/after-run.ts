import fs from "fs";
import path from "path";
import { CypressRunResultType } from "../../types/cypress/run-result";
import { IssueTypeDetails } from "../../types/jira/responses/issue-type-details";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { ExecutableGraph } from "../../util/graph/executable";
import { LOG, Level } from "../../util/logging";
import { Command, Computable, ComputableState } from "../command";
import { ConstantCommand } from "../util/commands/constant-command";
import { FallbackCommand } from "../util/commands/fallback-command";
import { AttachFilesCommand } from "../util/commands/jira/attach-files-command";
import { JiraField } from "../util/commands/jira/extract-field-id-command";
import { FetchIssueTypesCommand } from "../util/commands/jira/fetch-issue-types-command";
import { ImportExecutionCucumberCommand } from "../util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { createExtractFieldIdCommand } from "../util/util";
import { AssertCucumberConversionValidCommand } from "./commands/conversion/cucumber/assert-cucumber-conversion-valid-command";
import { CombineCucumberMultipartCommand } from "./commands/conversion/cucumber/combine-cucumber-multipart-command";
import { ConvertCucumberFeaturesCommand } from "./commands/conversion/cucumber/convert-cucumber-features-command";
import {
    ConvertCucumberInfoCloudCommand,
    ConvertCucumberInfoCommand,
    ConvertCucumberInfoServerCommand,
} from "./commands/conversion/cucumber/convert-cucumber-info-command";
import { AssertCypressConversionValidCommand } from "./commands/conversion/cypress/assert-cypress-conversion-valid-command";
import { CombineCypressJsonCommand } from "./commands/conversion/cypress/combine-cypress-xray-command";
import { ConvertCypressInfoCommand } from "./commands/conversion/cypress/convert-cypress-info-command";
import { ConvertCypressTestsCommand } from "./commands/conversion/cypress/convert-cypress-tests-command";
import { ExtractExecutionIssueTypeCommand } from "./commands/extract-execution-issue-type-command";
import { ExtractVideoFilesCommand } from "./commands/extract-video-files-command";
import { VerifyExecutionIssueKeyCommand } from "./commands/verify-execution-issue-key-command";
import { VerifyResultsUploadCommand } from "./commands/verify-results-upload-command";
import { containsCucumberTest, containsCypressTest } from "./util";

export function addUploadCommands(
    runResult: CypressRunResultType,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): void {
    const containsCypressTests = containsCypressTest(
        runResult,
        options.cucumber?.featureFileExtension
    );
    const containsCucumberTests = containsCucumberTest(
        runResult,
        options.cucumber?.featureFileExtension
    );
    if (!containsCypressTests && !containsCucumberTests) {
        LOG.message(
            Level.WARNING,
            "No test execution results to upload, skipping results upload preparations"
        );
        return;
    }
    const cypressResultsCommand = graph.findOrDefault(
        (command): command is ConstantCommand<CypressRunResultType> =>
            command instanceof ConstantCommand && command.getValue() === runResult,
        () => graph.place(new ConstantCommand(runResult))
    );
    let importCypressExecutionCommand: ImportExecutionCypressCommand | null = null;
    let importCucumberExecutionCommand: ImportExecutionCucumberCommand | null = null;
    if (containsCypressTests) {
        importCypressExecutionCommand = getImportExecutionCypressCommand(
            cypressResultsCommand,
            options,
            clients,
            graph
        );
    }
    if (containsCucumberTests) {
        if (!options.cucumber?.preprocessor?.json.output) {
            throw new Error(
                "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured"
            );
        }
        const cucumberResults: CucumberMultipartFeature[] = JSON.parse(
            fs.readFileSync(options.cucumber.preprocessor.json.output, "utf-8")
        ) as CucumberMultipartFeature[];
        const cucumberResultsCommand = graph.place(new ConstantCommand(cucumberResults));
        let testExecutionIssueKeyCommand: Command<string | undefined> | undefined = undefined;
        if (options.jira.testExecutionIssueKey) {
            testExecutionIssueKeyCommand = graph.place(
                new ConstantCommand(options.jira.testExecutionIssueKey)
            );
        } else if (importCypressExecutionCommand) {
            // Use an optional command in case the Cypress import fails. We could then still upload
            // Cucumber results.
            const fallbackExecutionIssueKeyCommand = graph.place(
                new FallbackCommand(
                    {
                        fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                        fallbackValue: undefined,
                    },
                    importCypressExecutionCommand
                )
            );
            graph.connect(importCypressExecutionCommand, fallbackExecutionIssueKeyCommand, true);
            testExecutionIssueKeyCommand = fallbackExecutionIssueKeyCommand;
        }
        importCucumberExecutionCommand = getImportExecutionCucumberCommand(
            cypressResultsCommand,
            cucumberResultsCommand,
            options,
            clients,
            graph,
            testExecutionIssueKeyCommand
        );
        // Make sure to add an edge from any feature file imports to the execution. Otherwise, the
        // execution will contain old steps (those which were there prior to feature import).
        if (options.cucumber.uploadFeatures) {
            for (const importFeatureCommand of graph.getVertices()) {
                if (importFeatureCommand instanceof ImportFeatureCommand) {
                    if (
                        runResult.runs.some(
                            (run) =>
                                path.relative(projectRoot, run.spec.relative) ===
                                importFeatureCommand.getParameters().filePath
                        )
                    ) {
                        // We can still upload results even if the feature file import fails. It's
                        // better to upload mismatched results than none at all.
                        graph.connect(importFeatureCommand, importCucumberExecutionCommand, true);
                    }
                }
            }
        }
    }
    addPostUploadCommands(
        cypressResultsCommand,
        options,
        clients,
        graph,
        importCypressExecutionCommand,
        importCucumberExecutionCommand
    );
}

function getImportExecutionCypressCommand(
    cypressResultsCommand: Command<CypressRunResultType>,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): ImportExecutionCypressCommand {
    const convertCypressTestsCommand = graph.place(
        new ConvertCypressTestsCommand(
            { ...options, useCloudStatusFallback: clients.kind === "cloud" },
            cypressResultsCommand
        )
    );
    graph.connect(cypressResultsCommand, convertCypressTestsCommand);
    const convertCypressInfoCommand = graph.place(
        new ConvertCypressInfoCommand(options, cypressResultsCommand)
    );
    graph.connect(cypressResultsCommand, convertCypressInfoCommand);
    const combineResultsJsonCommand = graph.place(
        new CombineCypressJsonCommand(
            { testExecutionIssueKey: options.jira.testExecutionIssueKey },
            convertCypressTestsCommand,
            convertCypressInfoCommand
        )
    );
    graph.connect(convertCypressTestsCommand, combineResultsJsonCommand);
    graph.connect(convertCypressInfoCommand, combineResultsJsonCommand);
    const assertConversionValidCommand = graph.place(
        new AssertCypressConversionValidCommand(combineResultsJsonCommand)
    );
    graph.connect(combineResultsJsonCommand, assertConversionValidCommand);
    const importCypressExecutionCommand = graph.place(
        new ImportExecutionCypressCommand(
            { xrayClient: clients.xrayClient },
            combineResultsJsonCommand
        )
    );
    graph.connect(assertConversionValidCommand, importCypressExecutionCommand);
    graph.connect(combineResultsJsonCommand, importCypressExecutionCommand);
    if (options.jira.testExecutionIssueKey) {
        const verifyExecutionIssueKeyCommand = graph.place(
            new VerifyExecutionIssueKeyCommand(
                {
                    testExecutionIssueKey: options.jira.testExecutionIssueKey,
                    testExecutionIssueType: options.jira.testExecutionIssueType,
                    importType: "cypress",
                    displayCloudHelp: clients.kind === "cloud",
                },
                importCypressExecutionCommand
            )
        );
        graph.connect(importCypressExecutionCommand, verifyExecutionIssueKeyCommand);
    }
    return importCypressExecutionCommand;
}

function getImportExecutionCucumberCommand(
    cypressResultsCommand: Command<CypressRunResultType>,
    cucumberResultsCommand: ConstantCommand<CucumberMultipartFeature[]>,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    testExecutionIssueKeyCommand?: Command<string | undefined>
): ImportExecutionCucumberCommand {
    const fetchIssueTypesCommand = graph.findOrDefault(
        (command): command is FetchIssueTypesCommand => command instanceof FetchIssueTypesCommand,
        () => graph.place(new FetchIssueTypesCommand({ jiraClient: clients.jiraClient }))
    );
    const extractExecutionIssueTypeCommand = graph.place(
        new ExtractExecutionIssueTypeCommand(
            {
                projectKey: options.jira.projectKey,
                testExecutionIssueType: options.jira.testExecutionIssueType,
                displayCloudHelp: clients.kind === "cloud",
            },
            fetchIssueTypesCommand
        )
    );
    graph.connect(fetchIssueTypesCommand, extractExecutionIssueTypeCommand);
    const convertCucumberInfoCommand = getConvertCucumberInfoCommand(
        options,
        clients,
        graph,
        extractExecutionIssueTypeCommand,
        cypressResultsCommand
    );
    graph.connect(extractExecutionIssueTypeCommand, convertCucumberInfoCommand);
    graph.connect(cypressResultsCommand, convertCucumberInfoCommand);
    const convertCucumberFeaturesCommand = graph.place(
        new ConvertCucumberFeaturesCommand(
            { ...options, useCloudTags: clients.kind === "cloud" },
            cucumberResultsCommand,
            testExecutionIssueKeyCommand
        )
    );
    graph.connect(cucumberResultsCommand, convertCucumberFeaturesCommand);
    if (testExecutionIssueKeyCommand) {
        graph.connect(testExecutionIssueKeyCommand, convertCucumberFeaturesCommand);
    }
    const combineCucumberMultipartCommand = graph.place(
        new CombineCucumberMultipartCommand(
            convertCucumberInfoCommand,
            convertCucumberFeaturesCommand
        )
    );
    graph.connect(convertCucumberInfoCommand, combineCucumberMultipartCommand);
    graph.connect(convertCucumberFeaturesCommand, combineCucumberMultipartCommand);
    const assertConversionValidCommand = graph.place(
        new AssertCucumberConversionValidCommand(combineCucumberMultipartCommand)
    );
    graph.connect(combineCucumberMultipartCommand, assertConversionValidCommand);
    const importCucumberExecutionCommand = graph.place(
        new ImportExecutionCucumberCommand(
            { xrayClient: clients.xrayClient },
            combineCucumberMultipartCommand
        )
    );
    graph.connect(assertConversionValidCommand, importCucumberExecutionCommand);
    graph.connect(combineCucumberMultipartCommand, importCucumberExecutionCommand);
    if (options.jira.testExecutionIssueKey) {
        const verifyExecutionIssueKeyCommand = graph.place(
            new VerifyExecutionIssueKeyCommand(
                {
                    testExecutionIssueKey: options.jira.testExecutionIssueKey,
                    testExecutionIssueType: options.jira.testExecutionIssueType,
                    importType: "cucumber",
                    displayCloudHelp: clients.kind === "cloud",
                },
                importCucumberExecutionCommand
            )
        );
        graph.connect(importCucumberExecutionCommand, verifyExecutionIssueKeyCommand);
    }
    return importCucumberExecutionCommand;
}

function getConvertCucumberInfoCommand(
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    executionIssueType: Computable<IssueTypeDetails>,
    cypressResults: Computable<CypressRunResultType>
): ConvertCucumberInfoCommand {
    if (clients.kind === "cloud") {
        return graph.place(
            new ConvertCucumberInfoCloudCommand(options, executionIssueType, cypressResults)
        );
    }
    let testPlanIdCommand: Command<string> | undefined = undefined;
    let testEnvironmentsIdCommand: Command<string> | undefined = undefined;
    if (
        options.jira.testPlanIssueKey !== undefined ||
        options.xray.testEnvironments !== undefined
    ) {
        if (options.jira.testPlanIssueKey) {
            testPlanIdCommand = options.jira.fields.testPlan
                ? graph.place(new ConstantCommand(options.jira.fields.testPlan))
                : createExtractFieldIdCommand(JiraField.TEST_PLAN, clients.jiraClient, graph);
        }
        if (options.xray.testEnvironments) {
            testEnvironmentsIdCommand = options.jira.fields.testEnvironments
                ? graph.place(new ConstantCommand(options.jira.fields.testEnvironments))
                : createExtractFieldIdCommand(
                      JiraField.TEST_ENVIRONMENTS,
                      clients.jiraClient,
                      graph
                  );
        }
    }
    const convertCucumberInfoCommand = graph.place(
        new ConvertCucumberInfoServerCommand(options, executionIssueType, cypressResults, {
            testPlanId: testPlanIdCommand,
            testEnvironmentsId: testEnvironmentsIdCommand,
        })
    );
    if (testPlanIdCommand) {
        graph.connect(testPlanIdCommand, convertCucumberInfoCommand);
    }
    if (testEnvironmentsIdCommand) {
        graph.connect(testEnvironmentsIdCommand, convertCucumberInfoCommand);
    }
    return convertCucumberInfoCommand;
}

function addPostUploadCommands(
    cypressResultsCommand: Command<CypressRunResultType>,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    importCypressExecutionCommand: ImportExecutionCypressCommand | null,
    importCucumberExecutionCommand: ImportExecutionCucumberCommand | null
): void {
    let fallbackCypressUploadCommand: Command<string | undefined> | undefined = undefined;
    let fallbackCucumberUploadCommand: Command<string | undefined> | undefined = undefined;
    if (importCypressExecutionCommand) {
        fallbackCypressUploadCommand = graph.findOrDefault(
            (command): command is Command<string | undefined> => {
                if (!(command instanceof FallbackCommand)) {
                    return false;
                }
                const predecessors = [...graph.getPredecessors(command)];
                return (
                    predecessors.length === 1 &&
                    predecessors.includes(importCypressExecutionCommand)
                );
            },
            () => {
                const fallbackCommand = graph.place(
                    new FallbackCommand(
                        {
                            fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                            fallbackValue: undefined,
                        },
                        importCypressExecutionCommand
                    )
                );
                graph.connect(importCypressExecutionCommand, fallbackCommand, true);
                return fallbackCommand;
            }
        );
    }
    if (importCucumberExecutionCommand) {
        fallbackCucumberUploadCommand = graph.findOrDefault(
            (command): command is Command<string | undefined> => {
                if (!(command instanceof FallbackCommand)) {
                    return false;
                }
                const predecessors = [...graph.getPredecessors(command)];
                return (
                    predecessors.length === 1 &&
                    predecessors.includes(importCucumberExecutionCommand)
                );
            },
            () => {
                const fallbackCommand = graph.place(
                    new FallbackCommand(
                        {
                            fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                            fallbackValue: undefined,
                        },
                        importCucumberExecutionCommand
                    )
                );
                graph.connect(importCucumberExecutionCommand, fallbackCommand, true);
                return fallbackCommand;
            }
        );
    }
    const verifyResultsUploadCommand = graph.place(
        new VerifyResultsUploadCommand(
            { url: options.jira.url },
            {
                cypressExecutionIssueKey: fallbackCypressUploadCommand,
                cucumberExecutionIssueKey: fallbackCucumberUploadCommand,
            }
        )
    );
    if (fallbackCypressUploadCommand) {
        graph.connect(fallbackCypressUploadCommand, verifyResultsUploadCommand);
    }
    if (fallbackCucumberUploadCommand) {
        graph.connect(fallbackCucumberUploadCommand, verifyResultsUploadCommand);
    }
    if (options.jira.attachVideos) {
        const extractVideoFilesCommand = graph.place(
            new ExtractVideoFilesCommand(cypressResultsCommand)
        );
        graph.connect(cypressResultsCommand, extractVideoFilesCommand);
        const attachVideosCommand = graph.place(
            new AttachFilesCommand(
                { jiraClient: clients.jiraClient },
                extractVideoFilesCommand,
                verifyResultsUploadCommand
            )
        );
        graph.connect(extractVideoFilesCommand, attachVideosCommand);
        graph.connect(verifyResultsUploadCommand, attachVideosCommand);
    }
}