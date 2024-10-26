import fs from "fs";
import path from "path";
import { EvidenceCollection } from "../../context";
import { CypressRunResultType } from "../../types/cypress/cypress";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { getOrCall } from "../../util/functions";
import { ExecutableGraph } from "../../util/graph/executable-graph";
import { Level, Logger } from "../../util/logging";
import { Command, ComputableState } from "../command";
import { ConstantCommand } from "../util/commands/constant-command";
import { DestructureCommand } from "../util/commands/destructure-command";
import { FallbackCommand } from "../util/commands/fallback-command";
import { AttachFilesCommand } from "../util/commands/jira/attach-files-command";
import { JiraField } from "../util/commands/jira/extract-field-id-command";
import { GetSummaryValuesCommand } from "../util/commands/jira/get-summary-values-command";
import { TransitionIssueCommand } from "../util/commands/jira/transition-issue-command";
import { ImportExecutionCucumberCommand } from "../util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { getOrCreateConstantCommand, getOrCreateExtractFieldIdCommand } from "../util/util";
import {
    ConvertInfoCloudCommand,
    ConvertInfoServerCommand,
} from "./commands/conversion/convert-info-command";
import { AssertCucumberConversionValidCommand } from "./commands/conversion/cucumber/assert-cucumber-conversion-valid-command";
import { CombineCucumberMultipartCommand } from "./commands/conversion/cucumber/combine-cucumber-multipart-command";
import { ConvertCucumberFeaturesCommand } from "./commands/conversion/cucumber/convert-cucumber-features-command";
import { AssertCypressConversionValidCommand } from "./commands/conversion/cypress/assert-cypress-conversion-valid-command";
import { CombineCypressJsonCommand } from "./commands/conversion/cypress/combine-cypress-xray-command";
import { ConvertCypressTestsCommand } from "./commands/conversion/cypress/convert-cypress-tests-command";
import { ExtractVideoFilesCommand } from "./commands/extract-video-files-command";
import { VerifyExecutionIssueKeyCommand } from "./commands/verify-execution-issue-key-command";
import { VerifyResultsUploadCommand } from "./commands/verify-results-upload-command";
import { containsCucumberTest, containsCypressTest } from "./util";

export async function addUploadCommands(
    runResult: CypressRunResultType,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    evidenceCollection: EvidenceCollection,
    graph: ExecutableGraph<Command>,
    logger: Logger
) {
    const containsCypressTests = containsCypressTest(
        runResult,
        options.cucumber?.featureFileExtension
    );
    const containsCucumberTests = containsCucumberTest(
        runResult,
        options.cucumber?.featureFileExtension
    );
    if (!containsCypressTests && !containsCucumberTests) {
        logger.message(
            Level.WARNING,
            "No test execution results to upload, skipping results upload preparations."
        );
        return;
    }
    let importCypressExecutionCommand: ImportExecutionCypressCommand | null = null;
    let importCucumberExecutionCommand: ImportExecutionCucumberCommand | null = null;
    if (containsCypressTests) {
        importCypressExecutionCommand = await getImportExecutionCypressCommand(
            runResult,
            options,
            clients,
            evidenceCollection,
            graph,
            logger
        );
    }
    if (containsCucumberTests) {
        if (!options.cucumber?.preprocessor?.json.output) {
            throw new Error(
                "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured."
            );
        }
        // Cypress might change process.cwd(), so we need to query the root directory.
        // See: https://github.com/cypress-io/cypress/issues/22689
        const reportPath = path.resolve(projectRoot, options.cucumber.preprocessor.json.output);
        const cucumberResults = JSON.parse(
            fs.readFileSync(reportPath, "utf-8")
        ) as CucumberMultipartFeature[];
        const cucumberResultsCommand = getOrCreateConstantCommand(graph, logger, cucumberResults);
        let testExecutionIssueKeyCommand: Command<string | undefined> | undefined = undefined;
        const issueData = await getOrCall(options.jira.testExecutionIssue, { results: runResult });
        if (issueData?.key ?? options.jira.testExecutionIssueKey) {
            testExecutionIssueKeyCommand = getOrCreateConstantCommand(
                graph,
                logger,
                issueData?.key ?? options.jira.testExecutionIssueKey
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
                    logger,
                    importCypressExecutionCommand
                )
            );
            graph.connect(importCypressExecutionCommand, fallbackExecutionIssueKeyCommand, true);
            testExecutionIssueKeyCommand = fallbackExecutionIssueKeyCommand;
        }
        importCucumberExecutionCommand = await getImportExecutionCucumberCommand(
            runResult,
            cucumberResultsCommand,
            projectRoot,
            options,
            clients,
            graph,
            logger,
            testExecutionIssueKeyCommand
        );
        // Make sure to add an edge from any feature file imports to the execution. Otherwise, the
        // execution will contain old steps (those which were there prior to feature import).
        if (options.cucumber.uploadFeatures) {
            for (const importFeatureCommand of graph.getVertices()) {
                if (importFeatureCommand instanceof ImportFeatureCommand) {
                    const filePath = path.relative(
                        projectRoot,
                        importFeatureCommand.getParameters().filePath
                    );
                    if (
                        runResult.runs.some((run) => {
                            const specPath = path.relative(projectRoot, run.spec.relative);
                            return specPath === filePath;
                        })
                    ) {
                        // We can still upload results even if the feature file import fails. It's
                        // better to upload mismatched results than none at all.
                        graph.connect(importFeatureCommand, importCucumberExecutionCommand, true);
                    }
                }
            }
        }
    }
    await addPostUploadCommands(
        runResult,
        options,
        clients,
        graph,
        logger,
        importCypressExecutionCommand,
        importCucumberExecutionCommand
    );
}

async function getImportExecutionCypressCommand(
    runResult: CypressRunResultType,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    evidenceCollection: EvidenceCollection,
    graph: ExecutableGraph<Command>,
    logger: Logger
) {
    const cypressResultsCommand = getOrCreateConstantCommand(graph, logger, runResult);
    const convertCypressTestsCommand = graph.place(
        new ConvertCypressTestsCommand(
            {
                cucumber: options.cucumber,
                evidenceCollection: evidenceCollection,
                jira: options.jira,
                plugin: options.plugin,
                useCloudStatusFallback: clients.kind === "cloud",
                xray: options.xray,
            },
            logger,
            cypressResultsCommand
        )
    );
    graph.connect(cypressResultsCommand, convertCypressTestsCommand);
    const convertMultipartInfoCommand = await getConvertMultipartInfoCommand(
        runResult,
        options,
        clients,
        graph,
        logger
    );

    const issueData = await getOrCall(options.jira.testExecutionIssue, { results: runResult });
    const combineResultsJsonCommand = graph.place(
        new CombineCypressJsonCommand(
            {
                testExecutionIssueKey: issueData?.key ?? options.jira.testExecutionIssueKey,
            },
            logger,
            convertCypressTestsCommand,
            convertMultipartInfoCommand
        )
    );
    graph.connect(convertCypressTestsCommand, combineResultsJsonCommand);
    graph.connect(convertMultipartInfoCommand, combineResultsJsonCommand);
    const assertConversionValidCommand = graph.place(
        new AssertCypressConversionValidCommand(logger, combineResultsJsonCommand)
    );
    graph.connect(combineResultsJsonCommand, assertConversionValidCommand);
    const importCypressExecutionCommand = graph.place(
        new ImportExecutionCypressCommand(
            { xrayClient: clients.xrayClient },
            logger,
            combineResultsJsonCommand
        )
    );
    graph.connect(assertConversionValidCommand, importCypressExecutionCommand);
    graph.connect(combineResultsJsonCommand, importCypressExecutionCommand);
    if (issueData?.key ?? options.jira.testExecutionIssueKey) {
        const verifyExecutionIssueKeyCommand = graph.place(
            new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: clients.kind === "cloud",
                    importType: "cypress",
                    testExecutionIssueKey: issueData?.key ?? options.jira.testExecutionIssueKey,
                    testExecutionIssueType: issueData?.fields?.issuetype ?? {
                        name: options.jira.testExecutionIssueType,
                    },
                },
                logger,
                importCypressExecutionCommand
            )
        );
        graph.connect(importCypressExecutionCommand, verifyExecutionIssueKeyCommand);
    }
    return importCypressExecutionCommand;
}

async function getImportExecutionCucumberCommand(
    runResult: CypressRunResultType,
    cucumberResultsCommand: ConstantCommand<CucumberMultipartFeature[]>,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    logger: Logger,
    testExecutionIssueKeyCommand?: Command<string | undefined>
) {
    const convertMultipartInfoCommand = await getConvertMultipartInfoCommand(
        runResult,
        options,
        clients,
        graph,
        logger
    );
    const convertCucumberFeaturesCommand = graph.place(
        new ConvertCucumberFeaturesCommand(
            {
                cucumber: {
                    prefixes: {
                        precondition: options.cucumber?.prefixes.precondition,
                        test: options.cucumber?.prefixes.test,
                    },
                },
                jira: {
                    projectKey: options.jira.projectKey,
                },
                projectRoot: projectRoot,
                useCloudTags: clients.kind === "cloud",
                xray: {
                    status: options.xray.status,
                    testEnvironments: options.xray.testEnvironments,
                    uploadScreenshots: options.xray.uploadScreenshots,
                },
            },
            logger,
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
            logger,
            convertMultipartInfoCommand,
            convertCucumberFeaturesCommand
        )
    );
    graph.connect(convertMultipartInfoCommand, combineCucumberMultipartCommand);
    graph.connect(convertCucumberFeaturesCommand, combineCucumberMultipartCommand);
    const assertConversionValidCommand = graph.place(
        new AssertCucumberConversionValidCommand(logger, combineCucumberMultipartCommand)
    );
    graph.connect(combineCucumberMultipartCommand, assertConversionValidCommand);
    const importCucumberExecutionCommand = graph.place(
        new ImportExecutionCucumberCommand(
            { xrayClient: clients.xrayClient },
            logger,
            combineCucumberMultipartCommand
        )
    );
    graph.connect(assertConversionValidCommand, importCucumberExecutionCommand);
    graph.connect(combineCucumberMultipartCommand, importCucumberExecutionCommand);
    const issueData = await getOrCall(options.jira.testExecutionIssue, { results: runResult });
    if (issueData?.key ?? options.jira.testExecutionIssueKey) {
        const verifyExecutionIssueKeyCommand = graph.place(
            new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: clients.kind === "cloud",
                    importType: "cucumber",
                    testExecutionIssueKey: issueData?.key ?? options.jira.testExecutionIssueKey,
                    testExecutionIssueType: issueData?.fields?.issuetype ?? {
                        name: options.jira.testExecutionIssueType,
                    },
                },
                logger,
                importCucumberExecutionCommand
            )
        );
        graph.connect(importCucumberExecutionCommand, verifyExecutionIssueKeyCommand);
    }
    return importCucumberExecutionCommand;
}

async function getExtractExecutionIssueTypeCommand(
    runResult: CypressRunResultType,
    options: InternalCypressXrayPluginOptions,
    graph: ExecutableGraph<Command>,
    logger: Logger
) {
    const issueData = await getOrCall(options.jira.testExecutionIssue, { results: runResult });
    if (issueData?.fields?.issuetype ?? options.jira.testExecutionIssueType) {
        return getOrCreateConstantCommand(
            graph,
            logger,
            issueData?.fields?.issuetype ?? {
                name: options.jira.testExecutionIssueType,
            }
        );
    }
    return getOrCreateConstantCommand(graph, logger, { name: "Test Execution" });
}

async function getExecutionIssueSummaryCommand(
    runResult: CypressRunResultType,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    logger: Logger
) {
    const issueData = await getOrCall(options.jira.testExecutionIssue, { results: runResult });
    const testExecutionIssueSummary =
        issueData?.fields?.summary ?? options.jira.testExecutionIssueSummary;
    if (testExecutionIssueSummary) {
        return getOrCreateConstantCommand(graph, logger, testExecutionIssueSummary);
    }
    const testExecutionIssueKey = issueData?.key ?? options.jira.testExecutionIssueKey;
    if (testExecutionIssueKey) {
        const issueKeysCommand = getOrCreateConstantCommand(graph, logger, [testExecutionIssueKey]);
        const getSummaryValuesCommand = graph.findOrDefault(
            GetSummaryValuesCommand,
            () => {
                const command = graph.place(
                    new GetSummaryValuesCommand(
                        { jiraClient: clients.jiraClient },
                        logger,
                        issueKeysCommand
                    )
                );
                graph.connect(issueKeysCommand, command);
                return command;
            },
            (vertex) => [...graph.getPredecessors(vertex)].includes(issueKeysCommand)
        );
        const destructureCommand = graph.place(
            new DestructureCommand(logger, getSummaryValuesCommand, testExecutionIssueKey)
        );
        graph.connect(getSummaryValuesCommand, destructureCommand);
        return destructureCommand;
    }
    return getOrCreateConstantCommand(
        graph,
        logger,
        `Execution Results [${runResult.startedTestsAt}]`
    );
}

async function getConvertMultipartInfoCommand(
    runResult: CypressRunResultType,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    logger: Logger
) {
    let convertCommand;
    if (clients.kind === "cloud") {
        convertCommand = graph.find((command) => command instanceof ConvertInfoCloudCommand);
    } else {
        convertCommand = graph.find((command) => command instanceof ConvertInfoServerCommand);
    }
    if (convertCommand) {
        return convertCommand;
    }
    const executionIssueSummaryCommand = await getExecutionIssueSummaryCommand(
        runResult,
        options,
        clients,
        graph,
        logger
    );
    const extractExecutionIssueTypeCommand = await getExtractExecutionIssueTypeCommand(
        runResult,
        options,
        graph,
        logger
    );
    const cypressResultsCommand = getOrCreateConstantCommand(graph, logger, runResult);
    if (clients.kind === "cloud") {
        convertCommand = graph.place(
            new ConvertInfoCloudCommand(
                { jira: options.jira, xray: options.xray },
                logger,
                cypressResultsCommand,
                {
                    summary: executionIssueSummaryCommand,
                    testExecutionIssueType: extractExecutionIssueTypeCommand,
                }
            )
        );
    } else {
        let testPlanIdCommand: Command<string> | undefined = undefined;
        let testEnvironmentsIdCommand: Command<string> | undefined = undefined;
        if (options.jira.testPlanIssueKey) {
            testPlanIdCommand = options.jira.fields.testPlan
                ? getOrCreateConstantCommand(graph, logger, options.jira.fields.testPlan)
                : getOrCreateExtractFieldIdCommand(
                      JiraField.TEST_PLAN,
                      clients.jiraClient,
                      graph,
                      logger
                  );
        }
        if (options.xray.testEnvironments) {
            testEnvironmentsIdCommand = options.jira.fields.testEnvironments
                ? getOrCreateConstantCommand(graph, logger, options.jira.fields.testEnvironments)
                : getOrCreateExtractFieldIdCommand(
                      JiraField.TEST_ENVIRONMENTS,
                      clients.jiraClient,
                      graph,
                      logger
                  );
        }
        convertCommand = graph.place(
            new ConvertInfoServerCommand(
                { jira: options.jira, xray: options.xray },
                logger,
                cypressResultsCommand,
                {
                    fieldIds: {
                        testEnvironmentsId: testEnvironmentsIdCommand,
                        testPlanId: testPlanIdCommand,
                    },
                    summary: executionIssueSummaryCommand,
                    testExecutionIssueType: extractExecutionIssueTypeCommand,
                }
            )
        );
        if (testPlanIdCommand) {
            graph.connect(testPlanIdCommand, convertCommand);
        }
        if (testEnvironmentsIdCommand) {
            graph.connect(testEnvironmentsIdCommand, convertCommand);
        }
    }
    graph.connect(executionIssueSummaryCommand, convertCommand);
    graph.connect(extractExecutionIssueTypeCommand, convertCommand);
    graph.connect(cypressResultsCommand, convertCommand);
    return convertCommand;
}

async function addPostUploadCommands(
    runResult: CypressRunResultType,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    logger: Logger,
    importCypressExecutionCommand: ImportExecutionCypressCommand | null,
    importCucumberExecutionCommand: ImportExecutionCucumberCommand | null
) {
    let fallbackCypressUploadCommand: Command<string | undefined> | undefined = undefined;
    let fallbackCucumberUploadCommand: Command<string | undefined> | undefined = undefined;
    if (importCypressExecutionCommand) {
        fallbackCypressUploadCommand = graph.findOrDefault(
            FallbackCommand<undefined, string>,
            () => {
                const fallbackCommand = graph.place(
                    new FallbackCommand(
                        {
                            fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                            fallbackValue: undefined,
                        },
                        logger,
                        importCypressExecutionCommand
                    )
                );
                graph.connect(importCypressExecutionCommand, fallbackCommand, true);
                return fallbackCommand;
            },
            (command) => {
                const predecessors = [...graph.getPredecessors(command)];
                return (
                    predecessors.length === 1 && predecessors[0] === importCypressExecutionCommand
                );
            }
        );
    }
    if (importCucumberExecutionCommand) {
        fallbackCucumberUploadCommand = graph.findOrDefault(
            FallbackCommand<undefined, string>,
            () => {
                const fallbackCommand = graph.place(
                    new FallbackCommand(
                        {
                            fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                            fallbackValue: undefined,
                        },
                        logger,
                        importCucumberExecutionCommand
                    )
                );
                graph.connect(importCucumberExecutionCommand, fallbackCommand, true);
                return fallbackCommand;
            },
            (command) => {
                const predecessors = [...graph.getPredecessors(command)];
                return (
                    predecessors.length === 1 && predecessors[0] === importCucumberExecutionCommand
                );
            }
        );
    }
    const verifyResultsUploadCommand = graph.place(
        new VerifyResultsUploadCommand({ url: options.jira.url }, logger, {
            cucumberExecutionIssueKey: fallbackCucumberUploadCommand,
            cypressExecutionIssueKey: fallbackCypressUploadCommand,
        })
    );
    if (fallbackCypressUploadCommand) {
        graph.connect(fallbackCypressUploadCommand, verifyResultsUploadCommand);
    }
    if (fallbackCucumberUploadCommand) {
        graph.connect(fallbackCucumberUploadCommand, verifyResultsUploadCommand);
    }
    const cypressResultsCommand = getOrCreateConstantCommand(graph, logger, runResult);
    if (options.jira.attachVideos) {
        const extractVideoFilesCommand = graph.place(
            new ExtractVideoFilesCommand(logger, cypressResultsCommand)
        );
        graph.connect(cypressResultsCommand, extractVideoFilesCommand);
        const attachVideosCommand = graph.place(
            new AttachFilesCommand(
                { jiraClient: clients.jiraClient },
                logger,
                extractVideoFilesCommand,
                verifyResultsUploadCommand
            )
        );
        graph.connect(extractVideoFilesCommand, attachVideosCommand);
        graph.connect(verifyResultsUploadCommand, attachVideosCommand);
    }
    // Workaround for: https://jira.atlassian.com/browse/JRASERVER-66881.
    const issueData = await getOrCall(options.jira.testExecutionIssue, { results: runResult });
    const testExecutionIssueKey = issueData?.key ?? options.jira.testExecutionIssueKey;
    if (issueData?.transition && !testExecutionIssueKey && clients.kind === "server") {
        const transitionIssueCommand = graph.place(
            new TransitionIssueCommand(
                {
                    jiraClient: clients.jiraClient,
                    transition: issueData.transition,
                },
                logger,
                verifyResultsUploadCommand
            )
        );
        graph.connect(verifyResultsUploadCommand, transitionIssueCommand);
    }
}
