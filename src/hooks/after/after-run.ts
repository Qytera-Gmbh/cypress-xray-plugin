import fs from "fs";
import path from "path";
import type { XrayClient } from "../../client/xray/xray-client";
import type { EvidenceCollection } from "../../context";
import type { CypressRunResultType } from "../../types/cypress/cypress";
import type { IssueTransition } from "../../types/jira/responses/issue-transition";
import type { IssueTypeDetails } from "../../types/jira/responses/issue-type-details";
import type {
    ClientCombination,
    InternalCypressXrayPluginOptions,
    PluginIssueUpdate,
} from "../../types/plugin";
import type { XrayTest } from "../../types/xray/import-test-execution-results";
import type {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../types/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../types/xray/requests/import-execution-multipart-info";
import { getOrCall } from "../../util/functions";
import type { ExecutableGraph } from "../../util/graph/executable-graph";
import type { Logger } from "../../util/logging";
import { Level } from "../../util/logging";
import type { Command } from "../command";
import { ComputableState } from "../command";
import type { ConstantCommand } from "../util/commands/constant-command";
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
    results: CypressRunResultType,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    evidenceCollection: EvidenceCollection,
    graph: ExecutableGraph<Command>,
    logger: Logger
) {
    const containsCypressTests = containsCypressTest(
        results,
        options.cucumber?.featureFileExtension
    );
    const containsCucumberTests = containsCucumberTest(
        results,
        options.cucumber?.featureFileExtension
    );
    if (!containsCypressTests && !containsCucumberTests) {
        logger.message(
            Level.WARNING,
            "No test execution results to upload, skipping results upload preparations."
        );
        return;
    }
    const issueData = await getOrCall(options.jira.testExecutionIssue, { results });
    const testPlanIssueKey = await getOrCall(options.jira.testPlanIssueKey, { results });
    const builder = new AfterRunBuilder({
        clients: clients,
        evidenceCollection: evidenceCollection,
        graph: graph,
        issueData: issueData,
        logger: logger,
        options: options,
        results: results,
    });
    let importCypressExecutionCommand;
    let importCucumberExecutionCommand;
    if (containsCypressTests) {
        importCypressExecutionCommand = getImportExecutionCypressCommand(graph, clients, builder, {
            reusesExecutionIssue: issueData?.key !== undefined,
            testEnvironments: options.xray.testEnvironments,
            testPlanIssueKey: testPlanIssueKey,
        });
    }
    if (containsCucumberTests) {
        importCucumberExecutionCommand = getImportExecutionCucumberCommand(
            graph,
            clients,
            builder,
            {
                cucumberReportPath: options.cucumber?.preprocessor?.json.output,
                projectRoot: projectRoot,
                reusesExecutionIssue: issueData?.key !== undefined,
                testEnvironments: options.xray.testEnvironments,
                testExecutionIssueKeyCommand: importCypressExecutionCommand,
                testPlanIssueKey: testPlanIssueKey,
            }
        );
        // Make sure to add an edge from any feature file imports to the execution. Otherwise, the
        // execution will contain old steps (those which were there prior to feature import).
        if (options.cucumber?.uploadFeatures) {
            for (const importFeatureCommand of graph.getVertices()) {
                if (importFeatureCommand instanceof ImportFeatureCommand) {
                    const filePath = path.relative(
                        projectRoot,
                        importFeatureCommand.getParameters().filePath
                    );
                    if (
                        results.runs.some((run) => {
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
    let fallbackCypressUploadCommand;
    let fallbackCucumberUploadCommand;
    if (importCypressExecutionCommand) {
        fallbackCypressUploadCommand = builder.addFallbackCommand({
            fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
            fallbackValue: undefined,
            input: importCypressExecutionCommand,
        });
    }
    if (importCucumberExecutionCommand) {
        fallbackCucumberUploadCommand = builder.addFallbackCommand({
            fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
            fallbackValue: undefined,
            input: importCucumberExecutionCommand,
        });
    }
    const finalExecutionIssueKey = builder.addVerifyResultUploadCommand({
        cucumberExecutionIssueKey: fallbackCucumberUploadCommand,
        cypressExecutionIssueKey: fallbackCypressUploadCommand,
    });
    if (options.jira.attachVideos) {
        builder.addAttachVideosCommand({ resolvedExecutionIssueKey: finalExecutionIssueKey });
    }
    // Workaround for: https://jira.atlassian.com/browse/JRASERVER-66881.
    if (issueData?.transition && !issueData.key && clients.kind === "server") {
        builder.addTransitionIssueCommand({
            issueKey: finalExecutionIssueKey,
            transition: issueData.transition,
        });
    }
}

function getImportExecutionCypressCommand(
    graph: ExecutableGraph<Command>,
    clients: ClientCombination,
    builder: AfterRunBuilder,
    options: {
        reusesExecutionIssue: boolean;
        testEnvironments?: string[];
        testPlanIssueKey?: string;
    }
) {
    const convertCypressTestsCommand = builder.addConvertCypressTestsCommand();
    const convertMultipartInfoCommand = addConvertMultipartInfoCommand(graph, clients, builder, {
        testEnvironments: options.testEnvironments,
        testPlanIssueKey: options.testPlanIssueKey,
    });
    const combineResultsJsonCommand = builder.addCombineCypressJsonCommand({
        convertCypressTestsCommand: convertCypressTestsCommand,
        convertMultipartInfoCommand: convertMultipartInfoCommand,
    });
    const assertConversionValidCommand = builder.addAssertCypressConversionValidCommand({
        xrayTestExecutionResults: combineResultsJsonCommand,
    });
    const importCypressExecutionCommand = builder.addImportExecutionCypressCommand({
        execution: combineResultsJsonCommand,
    });
    graph.connect(assertConversionValidCommand, importCypressExecutionCommand);
    if (options.reusesExecutionIssue) {
        builder.addVerifyExecutionIssueKeyCommand({
            importType: "cypress",
            resolvedExecutionIssue: importCypressExecutionCommand,
        });
    }
    return importCypressExecutionCommand;
}

function getImportExecutionCucumberCommand(
    graph: ExecutableGraph<Command>,
    clients: ClientCombination,
    builder: AfterRunBuilder,
    options: {
        cucumberReportPath?: string;
        projectRoot: string;
        reusesExecutionIssue: boolean;
        testEnvironments?: string[];
        testExecutionIssueKeyCommand?: Command<string>;
        testPlanIssueKey?: string;
    }
) {
    if (!options.cucumberReportPath) {
        throw new Error(
            "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured."
        );
    }
    const convertMultipartInfoCommand = addConvertMultipartInfoCommand(graph, clients, builder, {
        testEnvironments: options.testEnvironments,
        testPlanIssueKey: options.testPlanIssueKey,
    });
    const cucumberResultsCommand = builder.getCucumberResultsCommand({
        cucumberReportPath: options.cucumberReportPath,
        projectRoot: options.projectRoot,
    });
    const convertCucumberFeaturesCommand = builder.addConvertCucumberFeaturesCommand({
        cucumberResults: cucumberResultsCommand,
        projectRoot: options.projectRoot,
        testExecutionIssueKeyCommand: options.testExecutionIssueKeyCommand,
    });
    const combineCucumberMultipartCommand = builder.addCombineCucumberMultipartCommand({
        cucumberMultipartFeatures: convertCucumberFeaturesCommand,
        cucumberMultipartInfo: convertMultipartInfoCommand,
    });
    const assertConversionValidCommand = builder.addAssertCucumberConversionValidCommand({
        cucumberMultipart: combineCucumberMultipartCommand,
    });
    const importCucumberExecutionCommand = builder.addImportExecutionCucumberCommand({
        cucumberMultipart: combineCucumberMultipartCommand,
    });
    graph.connect(assertConversionValidCommand, importCucumberExecutionCommand);
    if (options.reusesExecutionIssue) {
        builder.addVerifyExecutionIssueKeyCommand({
            importType: "cucumber",
            resolvedExecutionIssue: importCucumberExecutionCommand,
        });
    }
    return importCucumberExecutionCommand;
}

function addConvertMultipartInfoCommand(
    graph: ExecutableGraph<Command>,
    clients: ClientCombination,
    builder: AfterRunBuilder,
    options: {
        testEnvironments?: string[];
        testPlanIssueKey?: string;
    }
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
    if (clients.kind === "cloud") {
        convertCommand = builder.addConvertInfoCloudCommand({
            testPlanIssueKey: options.testPlanIssueKey,
        });
    } else {
        let testPlanIdCommand: Command<string> | undefined = undefined;
        let testEnvironmentsIdCommand: Command<string> | undefined = undefined;
        if (options.testPlanIssueKey) {
            testPlanIdCommand = builder.addExtractFieldIdCommand("test-plan");
        }
        if (options.testEnvironments) {
            testEnvironmentsIdCommand = builder.addExtractFieldIdCommand("test-environments");
        }
        convertCommand = builder.addConvertInfoServerCommand({
            fieldIds: {
                testEnvironment: testEnvironmentsIdCommand,
                testPlan: testPlanIdCommand,
            },
            testPlanIssueKey: options.testPlanIssueKey,
        });
    }
    return convertCommand;
}

class AfterRunBuilder {
    private readonly graph: ExecutableGraph<Command>;
    private readonly results: CypressRunResultType;
    private readonly options: InternalCypressXrayPluginOptions;
    private readonly issueData: PluginIssueUpdate | undefined;
    private readonly evidenceCollection: EvidenceCollection;
    private readonly clients: ClientCombination;
    private readonly logger: Logger;
    private readonly constants: {
        executionIssue?: {
            issuetype?: Command<IssueTypeDetails>;
            issueUpdate?: Command<PluginIssueUpdate | undefined>;
            summary?: Command<string>;
        };
        results?: ConstantCommand<CypressRunResultType>;
    };

    constructor(args: {
        clients: ClientCombination;
        evidenceCollection: EvidenceCollection;
        graph: ExecutableGraph<Command>;
        issueData?: PluginIssueUpdate;
        logger: Logger;
        options: InternalCypressXrayPluginOptions;
        results: CypressRunResultType;
    }) {
        this.graph = args.graph;
        this.results = args.results;
        this.options = args.options;
        this.issueData = args.issueData;
        this.evidenceCollection = args.evidenceCollection;
        this.clients = args.clients;
        this.logger = args.logger;
        this.constants = {};
    }

    public getCucumberResultsCommand(parameters: {
        cucumberReportPath: string;
        projectRoot: string;
    }) {
        // Cypress might change process.cwd(), so we need to query the root directory.
        // See: https://github.com/cypress-io/cypress/issues/22689
        const reportPath = path.resolve(parameters.projectRoot, parameters.cucumberReportPath);
        const cucumberResults = JSON.parse(
            fs.readFileSync(reportPath, "utf-8")
        ) as CucumberMultipartFeature[];
        return getOrCreateConstantCommand(this.graph, this.logger, cucumberResults);
    }

    public addConvertCypressTestsCommand() {
        const resultsCommand = this.getResultsCommand();
        const command = this.graph.place(
            new ConvertCypressTestsCommand(
                {
                    evidenceCollection: this.evidenceCollection,
                    featureFileExtension: this.options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: this.options.plugin.normalizeScreenshotNames,
                    projectKey: this.options.jira.projectKey,
                    uploadScreenshots: this.options.xray.uploadScreenshots,
                    useCloudStatusFallback: this.clients.kind === "cloud",
                    xrayStatus: this.options.xray.status,
                },
                this.logger,
                resultsCommand
            )
        );
        this.graph.connect(resultsCommand, command);
        return command;
    }

    public addCombineCypressJsonCommand(parameters: {
        convertCypressTestsCommand: Command<[XrayTest, ...XrayTest[]]>;
        convertMultipartInfoCommand: Command<MultipartInfo>;
    }) {
        const command = this.graph.place(
            new CombineCypressJsonCommand(
                {
                    testExecutionIssueKey: this.issueData?.key,
                },
                this.logger,
                parameters.convertCypressTestsCommand,
                parameters.convertMultipartInfoCommand
            )
        );
        this.graph.connect(parameters.convertCypressTestsCommand, command);
        this.graph.connect(parameters.convertMultipartInfoCommand, command);
        return command;
    }

    public addAssertCypressConversionValidCommand(parameters: {
        xrayTestExecutionResults: Command<Parameters<XrayClient["importExecutionMultipart"]>>;
    }) {
        const command = this.graph.place(
            new AssertCypressConversionValidCommand(
                this.logger,
                parameters.xrayTestExecutionResults
            )
        );
        this.graph.connect(parameters.xrayTestExecutionResults, command);
        return command;
    }

    public addImportExecutionCypressCommand(parameters: {
        execution: Command<Parameters<XrayClient["importExecutionMultipart"]>>;
    }) {
        const command = this.graph.place(
            new ImportExecutionCypressCommand(
                { xrayClient: this.clients.xrayClient },
                this.logger,
                parameters.execution
            )
        );
        this.graph.connect(parameters.execution, command);
        return command;
    }

    public addExtractFieldIdCommand(field: "test-environments" | "test-plan") {
        switch (field) {
            case "test-plan":
                return this.options.jira.fields.testPlan
                    ? getOrCreateConstantCommand(
                          this.graph,
                          this.logger,
                          this.options.jira.fields.testPlan
                      )
                    : getOrCreateExtractFieldIdCommand(
                          JiraField.TEST_PLAN,
                          this.clients.jiraClient,
                          this.graph,
                          this.logger
                      );
            case "test-environments":
                return this.options.jira.fields.testEnvironments
                    ? getOrCreateConstantCommand(
                          this.graph,
                          this.logger,
                          this.options.jira.fields.testEnvironments
                      )
                    : getOrCreateExtractFieldIdCommand(
                          JiraField.TEST_ENVIRONMENTS,
                          this.clients.jiraClient,
                          this.graph,
                          this.logger
                      );
        }
    }

    public addConvertInfoCloudCommand(parameters: { testPlanIssueKey?: string }) {
        const resultsCommand = this.getResultsCommand();
        const issueData = this.getIssueData();
        const command = new ConvertInfoCloudCommand(
            {
                jira: {
                    projectKey: this.options.jira.projectKey,
                    testPlanIssueKey: parameters.testPlanIssueKey,
                },
                xray: this.options.xray,
            },
            this.logger,
            {
                issuetype: issueData.issuetype,
                issueUpdate: issueData.issueUpdate,
                results: resultsCommand,
                summary: issueData.summary,
            }
        );
        this.graph.place(command);
        this.graph.connect(resultsCommand, command);
        this.graph.connect(issueData.summary, command);
        this.graph.connect(issueData.issuetype, command);
        if (issueData.issueUpdate) {
            this.graph.connect(issueData.issueUpdate, command);
        }
        return command;
    }

    public addConvertInfoServerCommand(parameters: {
        fieldIds: {
            testEnvironment?: Command<string>;
            testPlan?: Command<string>;
        };
        testPlanIssueKey?: string;
    }) {
        const resultsCommand = this.getResultsCommand();
        const issueData = this.getIssueData();
        const command = new ConvertInfoServerCommand(
            {
                jira: {
                    projectKey: this.options.jira.projectKey,
                    testPlanIssueKey: parameters.testPlanIssueKey,
                },
                xray: this.options.xray,
            },
            this.logger,
            {
                fieldIds: {
                    testEnvironmentsId: parameters.fieldIds.testEnvironment,
                    testPlanId: parameters.fieldIds.testPlan,
                },
                issuetype: issueData.issuetype,
                issueUpdate: issueData.issueUpdate,
                results: resultsCommand,
                summary: issueData.summary,
            }
        );
        this.graph.place(command);
        this.graph.connect(resultsCommand, command);
        this.graph.connect(issueData.summary, command);
        this.graph.connect(issueData.issuetype, command);
        if (issueData.issueUpdate) {
            this.graph.connect(issueData.issueUpdate, command);
        }
        if (parameters.fieldIds.testEnvironment) {
            this.graph.connect(parameters.fieldIds.testEnvironment, command);
        }
        if (parameters.fieldIds.testPlan) {
            this.graph.connect(parameters.fieldIds.testPlan, command);
        }
        return command;
    }

    public addConvertCucumberFeaturesCommand(parameters: {
        cucumberResults: Command<CucumberMultipartFeature[]>;
        projectRoot: string;
        testExecutionIssueKeyCommand?: Command<string>;
    }) {
        let resolvedExecutionIssueKeyCommand;
        if (parameters.testExecutionIssueKeyCommand) {
            resolvedExecutionIssueKeyCommand = parameters.testExecutionIssueKeyCommand;
        } else {
            const executionIssueKey = this.issueData?.key;
            if (executionIssueKey) {
                resolvedExecutionIssueKeyCommand = getOrCreateConstantCommand(
                    this.graph,
                    this.logger,
                    executionIssueKey
                );
            }
        }
        const command = this.graph.place(
            new ConvertCucumberFeaturesCommand(
                {
                    cucumber: {
                        prefixes: {
                            precondition: this.options.cucumber?.prefixes.precondition,
                            test: this.options.cucumber?.prefixes.test,
                        },
                    },
                    jira: {
                        projectKey: this.options.jira.projectKey,
                    },
                    projectRoot: parameters.projectRoot,
                    useCloudTags: this.clients.kind === "cloud",
                    xray: {
                        status: this.options.xray.status,
                        testEnvironments: this.options.xray.testEnvironments,
                        uploadScreenshots: this.options.xray.uploadScreenshots,
                    },
                },
                this.logger,
                {
                    cucumberResults: parameters.cucumberResults,
                    testExecutionIssueKey: resolvedExecutionIssueKeyCommand,
                }
            )
        );
        this.graph.connect(parameters.cucumberResults, command);
        if (resolvedExecutionIssueKeyCommand) {
            this.graph.connect(resolvedExecutionIssueKeyCommand, command);
        }
        return command;
    }

    public addCombineCucumberMultipartCommand(parameters: {
        cucumberMultipartFeatures: Command<CucumberMultipartFeature[]>;
        cucumberMultipartInfo: Command<MultipartInfo>;
    }) {
        const command = this.graph.place(
            new CombineCucumberMultipartCommand(
                this.logger,
                parameters.cucumberMultipartInfo,
                parameters.cucumberMultipartFeatures
            )
        );
        this.graph.connect(parameters.cucumberMultipartInfo, command);
        this.graph.connect(parameters.cucumberMultipartFeatures, command);
        return command;
    }

    public addAssertCucumberConversionValidCommand(parameters: {
        cucumberMultipart: Command<CucumberMultipart>;
    }) {
        const command = this.graph.place(
            new AssertCucumberConversionValidCommand(this.logger, parameters.cucumberMultipart)
        );
        this.graph.connect(parameters.cucumberMultipart, command);
        return command;
    }

    public addVerifyExecutionIssueKeyCommand(parameters: {
        importType: "cucumber" | "cypress";
        resolvedExecutionIssue: Command<string>;
    }) {
        const command = this.graph.place(
            new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: this.clients.kind === "cloud",
                    importType: parameters.importType,
                    testExecutionIssueKey: this.issueData?.key,
                    testExecutionIssueType: this.issueData?.fields?.issuetype ?? {
                        name: "Test Execution",
                    },
                },
                this.logger,
                parameters.resolvedExecutionIssue
            )
        );
        this.graph.connect(parameters.resolvedExecutionIssue, command);
        return command;
    }

    public addImportExecutionCucumberCommand(parameters: {
        cucumberMultipart: Command<CucumberMultipart>;
    }) {
        const command = this.graph.place(
            new ImportExecutionCucumberCommand(
                { xrayClient: this.clients.xrayClient },
                this.logger,
                parameters.cucumberMultipart
            )
        );
        this.graph.connect(parameters.cucumberMultipart, command);
        return command;
    }

    public addFallbackCommand<V, R>(parameters: {
        fallbackOn: ComputableState[];
        fallbackValue: V;
        input: Command<R>;
    }) {
        return this.graph.findOrDefault(
            FallbackCommand<V, R>,
            () => {
                const command = this.graph.place(
                    new FallbackCommand<V, R>(
                        {
                            fallbackOn: parameters.fallbackOn,
                            fallbackValue: parameters.fallbackValue,
                        },
                        this.logger,
                        parameters.input
                    )
                );
                this.graph.connect(parameters.input, command, true);
                return command;
            },
            (command) => {
                const predecessors = [...this.graph.getPredecessors(command)];
                return predecessors.length === 1 && predecessors[0] === parameters.input;
            }
        );
    }

    public addVerifyResultUploadCommand(parameters: {
        cucumberExecutionIssueKey?: Command<string | undefined>;
        cypressExecutionIssueKey?: Command<string | undefined>;
    }) {
        const command = this.graph.place(
            new VerifyResultsUploadCommand({ url: this.options.jira.url }, this.logger, {
                cucumberExecutionIssueKey: parameters.cucumberExecutionIssueKey,
                cypressExecutionIssueKey: parameters.cypressExecutionIssueKey,
            })
        );
        if (parameters.cypressExecutionIssueKey) {
            this.graph.connect(parameters.cypressExecutionIssueKey, command);
        }
        if (parameters.cucumberExecutionIssueKey) {
            this.graph.connect(parameters.cucumberExecutionIssueKey, command);
        }
        return command;
    }

    public addAttachVideosCommand(parameters: { resolvedExecutionIssueKey: Command<string> }) {
        const resultsCommand = this.getResultsCommand();
        const extractVideoFilesCommand = this.graph.place(
            new ExtractVideoFilesCommand(this.logger, resultsCommand)
        );
        this.graph.connect(resultsCommand, extractVideoFilesCommand);
        const command = this.graph.place(
            new AttachFilesCommand(
                { jiraClient: this.clients.jiraClient },
                this.logger,
                extractVideoFilesCommand,
                parameters.resolvedExecutionIssueKey
            )
        );
        this.graph.connect(extractVideoFilesCommand, command);
        this.graph.connect(parameters.resolvedExecutionIssueKey, command);
        return command;
    }

    public addTransitionIssueCommand(parameters: {
        issueKey: Command<string>;
        transition: IssueTransition;
    }) {
        const command = this.graph.place(
            new TransitionIssueCommand(
                {
                    jiraClient: this.clients.jiraClient,
                    transition: parameters.transition,
                },
                this.logger,
                parameters.issueKey
            )
        );
        this.graph.connect(parameters.issueKey, command);
        return command;
    }

    private getIssueData() {
        let issueUpdateCommand;
        let summaryCommand = this.constants.executionIssue?.summary;
        let issuetypeCommand = this.constants.executionIssue?.issuetype;
        if (!this.constants.executionIssue?.issueUpdate && this.issueData) {
            issueUpdateCommand = getOrCreateConstantCommand(
                this.graph,
                this.logger,
                this.issueData
            );
            this.constants.executionIssue = {
                ...this.constants.executionIssue,
                issueUpdate: issueUpdateCommand,
            };
        }
        if (!summaryCommand) {
            const summary = this.issueData?.fields?.summary;
            if (summary) {
                summaryCommand = getOrCreateConstantCommand(this.graph, this.logger, summary);
            } else {
                const testExecutionIssueKey = this.issueData?.key;
                if (testExecutionIssueKey) {
                    const issueKeysCommand = getOrCreateConstantCommand(this.graph, this.logger, [
                        testExecutionIssueKey,
                    ]);
                    const getSummaryValuesCommand = this.graph.findOrDefault(
                        GetSummaryValuesCommand,
                        () => {
                            const command = this.graph.place(
                                new GetSummaryValuesCommand(
                                    { jiraClient: this.clients.jiraClient },
                                    this.logger,
                                    issueKeysCommand
                                )
                            );
                            this.graph.connect(issueKeysCommand, command);
                            return command;
                        },
                        (vertex) =>
                            [...this.graph.getPredecessors(vertex)].includes(issueKeysCommand)
                    );
                    summaryCommand = this.graph.place(
                        new DestructureCommand(
                            this.logger,
                            getSummaryValuesCommand,
                            testExecutionIssueKey
                        )
                    );
                    this.graph.connect(getSummaryValuesCommand, summaryCommand);
                } else {
                    summaryCommand = getOrCreateConstantCommand(
                        this.graph,
                        this.logger,
                        `Execution Results [${this.results.startedTestsAt}]`
                    );
                }
            }
            this.constants.executionIssue = {
                ...this.constants.executionIssue,
                summary: summaryCommand,
            };
        }
        if (!issuetypeCommand) {
            issuetypeCommand = getOrCreateConstantCommand(
                this.graph,
                this.logger,
                this.issueData?.fields?.issuetype ?? {
                    name: "Test Execution",
                }
            );
            this.constants.executionIssue = {
                ...this.constants.executionIssue,
                issuetype: issuetypeCommand,
            };
        }
        return {
            issuetype: issuetypeCommand,
            issueUpdate: issueUpdateCommand,
            summary: summaryCommand,
        };
    }

    private getResultsCommand() {
        if (!this.constants.results) {
            this.constants.results = getOrCreateConstantCommand(
                this.graph,
                this.logger,
                this.results
            );
        }
        return this.constants.results;
    }
}
