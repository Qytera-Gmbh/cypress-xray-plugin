import fs from "fs";
import path from "path";
import { LOG, Level } from "../../logging/logging";
import { containsCucumberTest, containsNativeTest } from "../../preprocessing/preprocessing";
import { IssueTypeDetails } from "../../types/jira/responses/issueTypeDetails";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ExecutableGraph } from "../../util/executable/executable";
import { Command, Computable } from "../command";
import { ConstantCommand } from "../util/commands/constantCommand";
import { AttachFilesCommand } from "../util/commands/jira/attachFilesCommand";
import { JiraField } from "../util/commands/jira/extractFieldIdCommand";
import { FetchIssueDetailsCommand } from "../util/commands/jira/fetchIssueDetailsCommand";
import { ImportExecutionCucumberCommand } from "../util/commands/xray/importExecutionCucumberCommand";
import { ImportExecutionCypressCommand } from "../util/commands/xray/importExecutionCypressCommand";
import { ImportFeatureCommand } from "../util/commands/xray/importFeatureCommand";
import { createExtractFieldIdCommand } from "../util/util";
import { CompareCypressCucumberKeysCommand } from "./commands/compareCypressCucumberKeysCommand";
import { AssertCucumberConversionValidCommand } from "./commands/conversion/cucumber/assertCucumberConversionValidCommand";
import { CombineCucumberMultipartCommand } from "./commands/conversion/cucumber/combineCucumberMultipartCommand";
import { ConvertCucumberFeaturesCommand } from "./commands/conversion/cucumber/convertCucumberFeaturesCommand";
import {
    ConvertCucumberInfoCloudCommand,
    ConvertCucumberInfoCommand,
    ConvertCucumberInfoServerCommand,
} from "./commands/conversion/cucumber/convertCucumberInfoCommand";
import { RunData } from "./commands/conversion/cucumber/util/multipartInfo";
import { AssertCypressConversionValidCommand } from "./commands/conversion/cypress/assertCypressConversionValidCommand";
import { CombineCypressJsonCommand } from "./commands/conversion/cypress/combineCypressXrayCommand";
import { ConvertCypressInfoCommand } from "./commands/conversion/cypress/convertCypressInfoCommand";
import { ConvertCypressTestsCommand } from "./commands/conversion/cypress/convertCypressTestsCommand";
import { ExtractExecutionIssueDetailsCommand } from "./commands/extractExecutionIssueDetailsCommand";
import { ExtractVideoFilesCommand } from "./commands/extractVideoFilesCommand";
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
            (command): command is ConstantCommand<CypressCommandLine.CypressRunResult> =>
                command instanceof ConstantCommand && command.getValue() === runResult,
            () => graph.place(new ConstantCommand(runResult))
        );
        const extractVideoFilesCommand = graph.place(
            new ExtractVideoFilesCommand(resultsCommand, getExecutionIssueKeyCommand)
        );
        graph.connect(resultsCommand, extractVideoFilesCommand);
        graph.connect(getExecutionIssueKeyCommand, extractVideoFilesCommand);
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
    results: CypressCommandLine.CypressRunResult,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): ImportExecutionCypressCommand {
    const resultsCommand = graph.findOrDefault(
        (command): command is ConstantCommand<CypressCommandLine.CypressRunResult> =>
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
            },
            fetchIssueTypesCommand
        )
    );
    graph.connect(fetchIssueTypesCommand, fetchExecutionIssueDetailsCommand);
    const resultsCommand = graph.findOrDefault(
        (command): command is ConstantCommand<CypressCommandLine.CypressRunResult> =>
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
