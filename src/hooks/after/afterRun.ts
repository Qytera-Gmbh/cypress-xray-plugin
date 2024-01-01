import fs from "fs";
import path from "path";
import { Command, Computable } from "../../commands/command";
import { ConstantCommand } from "../../commands/constantCommand";
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
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ExecutableGraph } from "../../util/executable/executable";
import { createExtractFieldIdCommand } from "../util";
import { AssertCucumberConversionValidCommand } from "./commands/assertCucumberConversionValidCommand";
import { AssertCypressConversionValidCommand } from "./commands/assertCypressConversionValidCommand";
import { CombineCucumberMultipartCommand } from "./commands/combineCucumberMultipartCommand";
import { CombineCypressJsonCommand } from "./commands/combineCypressXrayCommand";
import { CompareCypressCucumberKeysCommand } from "./commands/compareCypressCucumberKeysCommand";
import { ExtractVideoFilesCommand } from "./commands/extractVideoFilesCommand";
import { FetchExecutionIssueDetailsCommand } from "./commands/fetchExecutionIssueDetailsCommand";
import { PrintUploadSuccessCommand } from "./commands/printUploadSuccessCommand";
import { VerifyExecutionIssueKeyCommand } from "./commands/verifyExecutionIssueKeyCommand";

export function addUploadCommands(
    runResult: CypressCommandLine.CypressRunResult,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): void {
    let importCypressExecutionCommand: ImportExecutionCypressCommand | null = null;
    let importCucumberExecutionCommand: ImportExecutionCucumberCommand | null = null;
    if (containsNativeTest(runResult, options.cucumber?.featureFileExtension)) {
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
            testExecutionIssueKeyCommand = new ConstantCommand(options.jira.testExecutionIssueKey);
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
        getExecutionIssueKeyCommand = new CompareCypressCucumberKeysCommand(
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
    const printSuccessCommand = new PrintUploadSuccessCommand(
        { url: options.jira.url },
        getExecutionIssueKeyCommand
    );
    graph.connect(getExecutionIssueKeyCommand, printSuccessCommand);
    if (options.jira.attachVideos) {
        const resultsCommand = graph.findOrDefault(
            (command): command is ConstantCommand<CypressCommandLine.CypressRunResult> =>
                command instanceof ConstantCommand && command.getValue() === runResult,
            () => new ConstantCommand(runResult)
        );
        const extractVideoFilesCommand = new ExtractVideoFilesCommand(
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

function createImportExecutionCypressCommand(
    results: CypressCommandLine.CypressRunResult,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): ImportExecutionCypressCommand {
    const resultsCommand = graph.findOrDefault(
        (command): command is ConstantCommand<CypressCommandLine.CypressRunResult> =>
            command instanceof ConstantCommand && command.getValue() === results,
        () => new ConstantCommand(results)
    );
    const convertCypressTestsCommand = new ConvertCypressTestsCommand(
        { ...options, useCloudStatusFallback: clients.kind === "cloud" },
        resultsCommand
    );
    graph.connect(resultsCommand, convertCypressTestsCommand);
    const convertCypressInfoCommand = new ConvertCypressInfoCommand(options, resultsCommand);
    graph.connect(resultsCommand, convertCypressInfoCommand);
    const combineResultsJsonCommand = new CombineCypressJsonCommand(
        { testExecutionIssueKey: options.jira.testExecutionIssueKey },
        convertCypressTestsCommand,
        convertCypressInfoCommand
    );
    graph.connect(convertCypressTestsCommand, combineResultsJsonCommand);
    graph.connect(convertCypressInfoCommand, combineResultsJsonCommand);
    const assertConversionValidCommand = new AssertCypressConversionValidCommand(
        combineResultsJsonCommand
    );
    graph.connect(combineResultsJsonCommand, assertConversionValidCommand);
    const importCypressExecutionCommand = new ImportExecutionCypressCommand(
        clients.xrayClient,
        combineResultsJsonCommand
    );
    graph.connect(assertConversionValidCommand, importCypressExecutionCommand);
    if (options.jira.testExecutionIssueKey) {
        const verifyIssueKeysCommand = new VerifyExecutionIssueKeyCommand(
            {
                testExecutionIssueKey: options.jira.testExecutionIssueKey,
                testExecutionIssueType: options.jira.testExecutionIssueType,
                importType: "cypress",
            },
            importCypressExecutionCommand
        );
        graph.connect(importCypressExecutionCommand, verifyIssueKeysCommand);
    }
    return importCypressExecutionCommand;
}

function createImportExecutionCucumberCommand(
    cypressResults: CypressCommandLine.CypressRunResult,
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
    const cucumberResultsCommand = new ConstantCommand(results);
    const fetchIssueTypesCommand = graph.findOrDefault(
        (command): command is FetchIssueTypesCommand => command instanceof FetchIssueTypesCommand,
        () => new FetchIssueTypesCommand(clients.jiraClient)
    );
    const fetchExecutionIssueDetailsCommand = new FetchExecutionIssueDetailsCommand(
        {
            projectKey: options.jira.projectKey,
            testExecutionIssueType: options.jira.testExecutionIssueType,
        },
        fetchIssueTypesCommand
    );
    graph.connect(fetchIssueTypesCommand, fetchExecutionIssueDetailsCommand);
    const resultsCommand = graph.findOrDefault(
        (command): command is ConstantCommand<CypressCommandLine.CypressRunResult> =>
            command instanceof ConstantCommand && command.getValue() === cypressResults,
        () => new ConstantCommand(cypressResults)
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
    const convertCucumberFeaturesCommand = new ConvertCucumberFeaturesCommand(
        { ...options, useCloudTags: clients.kind === "cloud" },
        cucumberResultsCommand,
        testExecutionIssueKeyCommand
    );
    graph.connect(cucumberResultsCommand, convertCucumberFeaturesCommand);
    if (testExecutionIssueKeyCommand) {
        graph.connect(testExecutionIssueKeyCommand, convertCucumberFeaturesCommand);
    }
    const combineCucumberMultipartCommand = new CombineCucumberMultipartCommand(
        convertCucumberInfoCommand,
        convertCucumberFeaturesCommand
    );
    graph.connect(convertCucumberInfoCommand, combineCucumberMultipartCommand);
    graph.connect(convertCucumberFeaturesCommand, combineCucumberMultipartCommand);
    const assertConversionValidCommand = new AssertCucumberConversionValidCommand(
        combineCucumberMultipartCommand
    );
    graph.connect(combineCucumberMultipartCommand, assertConversionValidCommand);
    const importCucumberExecutionCommand = new ImportExecutionCucumberCommand(
        clients.xrayClient,
        combineCucumberMultipartCommand
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
        const verifyIssueKeysCommand = new VerifyExecutionIssueKeyCommand(
            {
                testExecutionIssueKey: options.jira.testExecutionIssueKey,
                testExecutionIssueType: options.jira.testExecutionIssueType,
                importType: "cucumber",
            },
            importCucumberExecutionCommand
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
