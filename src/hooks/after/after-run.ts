import fs from "fs";
import path from "path";
import { CypressRunResultType } from "../../types/cypress/run-result";
import { IssueTypeDetails } from "../../types/jira/responses/issue-type-details";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { ExecutableGraph } from "../../util/graph/executable";
import { LOG, Level } from "../../util/logging";
import { Command, Computable } from "../command";
import { ConstantCommand } from "../util/commands/constant-command";
import { AttachFilesCommand } from "../util/commands/jira/attach-files-command";
import { JiraField } from "../util/commands/jira/extract-field-id-command";
import { FetchIssueDetailsCommand } from "../util/commands/jira/fetch-issue-details-command";
import { ImportExecutionCucumberCommand } from "../util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { createExtractFieldIdCommand } from "../util/util";
import { CompareCypressCucumberKeysCommand } from "./commands/compare-cypress-cucumber-keys-command";
import { AssertCucumberConversionValidCommand } from "./commands/conversion/cucumber/assert-cucumber-conversion-valid-command";
import { CombineCucumberMultipartCommand } from "./commands/conversion/cucumber/combine-cucumber-multipart-command";
import { ConvertCucumberFeaturesCommand } from "./commands/conversion/cucumber/convert-cucumber-features-command";
import {
    ConvertCucumberInfoCloudCommand,
    ConvertCucumberInfoCommand,
    ConvertCucumberInfoServerCommand,
} from "./commands/conversion/cucumber/convert-cucumber-info-command";
import { RunData } from "./commands/conversion/cucumber/util/multipart-info";
import { AssertCypressConversionValidCommand } from "./commands/conversion/cypress/assert-cypress-conversion-valid-command";
import { CombineCypressJsonCommand } from "./commands/conversion/cypress/combine-cypress-xray-command";
import { ConvertCypressInfoCommand } from "./commands/conversion/cypress/convert-cypress-info-command";
import { ConvertCypressTestsCommand } from "./commands/conversion/cypress/convert-cypress-tests-command";
import { ExtractExecutionIssueDetailsCommand } from "./commands/extract-execution-issue-details-command";
import { ExtractVideoFilesCommand } from "./commands/extract-video-files-command";
import { PrintUploadSuccessCommand } from "./commands/print-upload-success-command";
import { VerifyExecutionIssueKeyCommand } from "./commands/verify-execution-issue-key-command";
import { containsCucumberTest, containsCypressTest } from "./util";

export function addUploadCommands(
    runResult: CypressRunResultType,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): void {
    let importCypressExecutionCommand: ImportExecutionCypressCommand | null = null;
    let importCucumberExecutionCommand: ImportExecutionCucumberCommand | null = null;
    if (containsCypressTest(runResult, options.cucumber?.featureFileExtension)) {
        importCypressExecutionCommand = createImportExecutionCypressCommand(
            runResult,
            options,
            clients,
            graph
        );
    }
    if (containsCucumberTest(runResult, options.cucumber?.featureFileExtension)) {
        if (!options.cucumber?.preprocessor?.json.output) {
            throw new Error(
                "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured"
            );
        }
        let testExecutionIssueKeyCommand: Command<string> | undefined = undefined;
        if (options.jira.testExecutionIssueKey) {
            testExecutionIssueKeyCommand = graph.place(
                new ConstantCommand(options.jira.testExecutionIssueKey)
            );
        } else if (importCypressExecutionCommand) {
            testExecutionIssueKeyCommand = importCypressExecutionCommand;
        }
        importCucumberExecutionCommand = createImportExecutionCucumberCommand(
            runResult,
            projectRoot,
            options,
            clients,
            graph,
            testExecutionIssueKeyCommand
        );
    }
    // Retrieve the test execution issue key for further attachment uploads.
    let getExecutionIssueKeyCommand: Command<string>;
    if (importCypressExecutionCommand && importCucumberExecutionCommand) {
        getExecutionIssueKeyCommand = graph.place(
            new CompareCypressCucumberKeysCommand(
                importCypressExecutionCommand,
                importCucumberExecutionCommand
            )
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
    const printSuccessCommand = graph.place(
        new PrintUploadSuccessCommand({ url: options.jira.url }, getExecutionIssueKeyCommand)
    );
    graph.connect(getExecutionIssueKeyCommand, printSuccessCommand);
    if (options.jira.attachVideos) {
        const resultsCommand = graph.findOrDefault(
            (command): command is ConstantCommand<CypressRunResultType> =>
                command instanceof ConstantCommand && command.getValue() === runResult,
            () => graph.place(new ConstantCommand(runResult))
        );
        const extractVideoFilesCommand = graph.place(new ExtractVideoFilesCommand(resultsCommand));
        graph.connect(resultsCommand, extractVideoFilesCommand);
        const attachVideosCommand = graph.place(
            new AttachFilesCommand(
                clients.jiraClient,
                extractVideoFilesCommand,
                getExecutionIssueKeyCommand
            )
        );
        graph.connect(extractVideoFilesCommand, attachVideosCommand);
        graph.connect(getExecutionIssueKeyCommand, attachVideosCommand);
    }
}

function createImportExecutionCypressCommand(
    results: CypressRunResultType,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): ImportExecutionCypressCommand {
    const resultsCommand = graph.findOrDefault(
        (command): command is ConstantCommand<CypressRunResultType> =>
            command instanceof ConstantCommand && command.getValue() === results,
        () => graph.place(new ConstantCommand(results))
    );
    const convertCypressTestsCommand = graph.place(
        new ConvertCypressTestsCommand(
            { ...options, useCloudStatusFallback: clients.kind === "cloud" },
            resultsCommand
        )
    );
    graph.connect(resultsCommand, convertCypressTestsCommand);
    const convertCypressInfoCommand = graph.place(
        new ConvertCypressInfoCommand(options, resultsCommand)
    );
    graph.connect(resultsCommand, convertCypressInfoCommand);
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
        new ImportExecutionCypressCommand(clients.xrayClient, combineResultsJsonCommand)
    );
    graph.connect(assertConversionValidCommand, importCypressExecutionCommand);
    if (options.jira.testExecutionIssueKey) {
        const verifyIssueKeysCommand = graph.place(
            new VerifyExecutionIssueKeyCommand(
                {
                    testExecutionIssueKey: options.jira.testExecutionIssueKey,
                    testExecutionIssueType: options.jira.testExecutionIssueType,
                    importType: "cypress",
                },
                importCypressExecutionCommand
            )
        );
        graph.connect(importCypressExecutionCommand, verifyIssueKeysCommand);
    }
    return importCypressExecutionCommand;
}

function createImportExecutionCucumberCommand(
    cypressResults: CypressRunResultType,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    testExecutionIssueKeyCommand?: Command<string>
): ImportExecutionCucumberCommand {
    if (!options.cucumber?.preprocessor?.json.output) {
        throw new Error(
            "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured"
        );
    }
    const results: CucumberMultipartFeature[] = JSON.parse(
        fs.readFileSync(options.cucumber.preprocessor.json.output, "utf-8")
    ) as CucumberMultipartFeature[];
    const cucumberResultsCommand = graph.place(new ConstantCommand(results));
    const fetchIssueTypesCommand = graph.findOrDefault(
        (command): command is FetchIssueDetailsCommand =>
            command instanceof FetchIssueDetailsCommand,
        () => graph.place(new FetchIssueDetailsCommand(clients.jiraClient))
    );
    const fetchExecutionIssueDetailsCommand = graph.place(
        new ExtractExecutionIssueDetailsCommand(
            {
                projectKey: options.jira.projectKey,
                testExecutionIssueType: options.jira.testExecutionIssueType,
                displayCloudHelp: clients.kind === "cloud",
            },
            fetchIssueTypesCommand
        )
    );
    graph.connect(fetchIssueTypesCommand, fetchExecutionIssueDetailsCommand);
    const resultsCommand = graph.findOrDefault(
        (command): command is ConstantCommand<CypressRunResultType> =>
            command instanceof ConstantCommand && command.getValue() === cypressResults,
        () => graph.place(new ConstantCommand(cypressResults))
    );
    const convertCucumberInfoCommand = getConvertCucumberInfoCommand(
        options,
        clients,
        graph,
        fetchExecutionIssueDetailsCommand,
        resultsCommand
    );
    graph.connect(fetchExecutionIssueDetailsCommand, convertCucumberInfoCommand);
    graph.connect(resultsCommand, convertCucumberInfoCommand);
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
        new ImportExecutionCucumberCommand(clients.xrayClient, combineCucumberMultipartCommand)
    );
    // Make sure to add an edge from any feature file imports to the execution. Otherwise, the
    // execution will contain old steps (those which were there prior to feature import).
    if (options.cucumber.uploadFeatures) {
        for (const command of graph.getVertices()) {
            if (command instanceof ImportFeatureCommand) {
                if (
                    cypressResults.runs.some(
                        (run) =>
                            path.relative(projectRoot, run.spec.relative) === command.getFilePath()
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
        const verifyIssueKeysCommand = graph.place(
            new VerifyExecutionIssueKeyCommand(
                {
                    testExecutionIssueKey: options.jira.testExecutionIssueKey,
                    testExecutionIssueType: options.jira.testExecutionIssueType,
                    importType: "cucumber",
                },
                importCucumberExecutionCommand
            )
        );
        graph.connect(importCucumberExecutionCommand, verifyIssueKeysCommand);
    }
    return importCucumberExecutionCommand;
}

function getConvertCucumberInfoCommand(
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    executionIssueDetails: Computable<IssueTypeDetails>,
    results: Computable<RunData>
): ConvertCucumberInfoCommand {
    if (clients.kind === "cloud") {
        return graph.place(
            new ConvertCucumberInfoCloudCommand(options, executionIssueDetails, results)
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
        new ConvertCucumberInfoServerCommand(options, executionIssueDetails, results, {
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
