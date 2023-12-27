import fs from "fs";
import { JiraClient } from "../../client/jira/jiraClient";
import { ImportExecutionConverter } from "../../conversion/importExecution/importExecutionConverter";
import { ImportExecutionCucumberMultipartConverter } from "../../conversion/importExecutionCucumberMultipart/importExecutionCucumberMultipartConverter";
import { LOG, Level } from "../../logging/logging";
import { containsCucumberTest, containsNativeTest } from "../../preprocessing/preprocessing";
import {
    ClientCombination,
    InternalCypressXrayPluginOptions,
    PluginContext,
} from "../../types/plugin";
import { nonNull } from "../../types/util";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { commandToDot, graphToDot } from "../../util/graph/visualisation/dot";

export async function onAfterRun(
    results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult,
    context: PluginContext
): Promise<void> {
    if (!context.options.plugin.enabled) {
        LOG.message(Level.INFO, "Skipping after:run hook: Plugin disabled");
        return;
    }
    try {
        await context.graph.execute();
    } finally {
        if (context.options.plugin.debug) {
            const executionGraphFile = LOG.logToFile(
                await graphToDot(context.graph, commandToDot),
                "execution-graph.vz"
            );
            LOG.message(
                Level.DEBUG,
                dedent(`
                    Plugin execution graph saved to: ${executionGraphFile}

                    You can view it using Graphviz DOT (https://graphviz.org/docs/layouts/dot/):

                      dot -o execution-graph.svg -Tsvg ${executionGraphFile}

                    Alternatively, you can view it online under any of the following websites:
                    - https://dreampuf.github.io/GraphvizOnline
                    - https://edotor.net/
                    - https://www.devtoolsdaily.com/graphviz/

                `)
            );
        }
    }
    if (context.options.xray.uploadResults) {
        // Cypress's status types are incomplete, there is also "finished".
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if ("status" in results && results.status === "failed") {
            const failedResult = results;
            LOG.message(
                Level.ERROR,
                dedent(`
                    Skipping after:run hook: Failed to run ${failedResult.failures} tests

                    ${failedResult.message}
                `)
            );
            return;
        }
        await uploadResults(
            results as CypressCommandLine.CypressRunResult,
            context.options,
            context.clients
        );
    } else {
        LOG.message(
            Level.INFO,
            "Skipping results upload: Plugin is configured to not upload test results"
        );
    }
}

async function uploadResults(
    results: CypressCommandLine.CypressRunResult,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination
) {
    const runResult = results;
    let issueKey: string | null | undefined = null;
    if (containsNativeTest(runResult, options.cucumber?.featureFileExtension)) {
        LOG.message(Level.INFO, "Uploading native Cypress test results...");
        issueKey = await uploadCypressResults(runResult, options, clients);
        if (
            options.jira.testExecutionIssueKey &&
            issueKey &&
            issueKey !== options.jira.testExecutionIssueKey
        ) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Cypress execution results were imported to test execution ${issueKey}, which is different from the configured one: ${options.jira.testExecutionIssueKey}

                    Make sure issue ${options.jira.testExecutionIssueKey} actually exists and is of type: ${options.jira.testExecutionIssueType}
                `)
            );
        } else if (!options.jira.testExecutionIssueKey && issueKey) {
            // Prevents Cucumber results upload from creating yet another execution issue.
            options.jira.testExecutionIssueKey = issueKey;
        }
    }
    if (containsCucumberTest(runResult, options.cucumber?.featureFileExtension)) {
        LOG.message(Level.INFO, "Uploading Cucumber test results...");
        const cucumberIssueKey = await uploadCucumberResults(runResult, options, clients);
        if (
            options.jira.testExecutionIssueKey &&
            cucumberIssueKey &&
            cucumberIssueKey !== options.jira.testExecutionIssueKey
        ) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Cucumber execution results were imported to test execution ${cucumberIssueKey}, which is different from the configured one: ${options.jira.testExecutionIssueKey}

                    Make sure issue ${options.jira.testExecutionIssueKey} actually exists and is of type: ${options.jira.testExecutionIssueType}
                `)
            );
        }
        if (
            options.jira.testExecutionIssueKey &&
            issueKey &&
            cucumberIssueKey &&
            cucumberIssueKey !== issueKey
        ) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Cucumber execution results were imported to a different test execution issue than the Cypress execution results.

                    This might be a bug, please report it at: https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues
                `)
            );
        } else if (!issueKey && cucumberIssueKey) {
            issueKey = cucumberIssueKey;
        }
    }
    if (issueKey === undefined) {
        LOG.message(Level.WARNING, "Execution results import failed. Skipping remaining tasks");
        return;
    } else if (issueKey === null) {
        LOG.message(
            Level.WARNING,
            "Execution results import was skipped. Skipping remaining tasks"
        );
        return;
    }
    LOG.message(
        Level.SUCCESS,
        `Uploaded test results to issue: ${issueKey} (${options.jira.url}/browse/${issueKey})`
    );
    if (options.jira.attachVideos) {
        await attachVideos(runResult, issueKey, clients.jiraClient);
    }
}

async function uploadCypressResults(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination
) {
    const converter = new ImportExecutionConverter(options, clients.kind === "cloud");
    try {
        const cypressExecution = await converter.toXrayJson(runResult);
        if (!cypressExecution.tests || cypressExecution.tests.length === 0) {
            LOG.message(
                Level.WARNING,
                "No native Cypress tests were executed. Skipping native upload."
            );
            return null;
        }
        return await clients.xrayClient.importExecution(cypressExecution);
    } catch (error: unknown) {
        LOG.message(Level.ERROR, errorMessage(error));
    }
}

async function uploadCucumberResults(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination
) {
    if (!options.cucumber?.preprocessor?.json.output) {
        throw new Error(
            "Failed to upload Cucumber results: Cucumber preprocessor JSON report path not configured"
        );
    }
    const results: CucumberMultipartFeature[] = JSON.parse(
        fs.readFileSync(options.cucumber.preprocessor.json.output, "utf-8")
    ) as CucumberMultipartFeature[];
    const converter = new ImportExecutionCucumberMultipartConverter(
        options,
        clients.kind === "cloud",
        clients.jiraRepository
    );
    try {
        const cucumberMultipart = await converter.convert(results, runResult);
        if (cucumberMultipart.features.length === 0) {
            LOG.message(
                Level.WARNING,
                "No Cucumber tests were executed. Skipping Cucumber upload."
            );
            return null;
        }
        return await clients.xrayClient.importExecutionCucumberMultipart(
            cucumberMultipart.features,
            cucumberMultipart.info
        );
    } catch (error: unknown) {
        LOG.message(Level.ERROR, errorMessage(error));
    }
}

async function attachVideos(
    runResult: CypressCommandLine.CypressRunResult,
    issueKey: string,
    jiraClient: JiraClient
): Promise<void> {
    const videos: string[] = runResult.runs
        .map((result: CypressCommandLine.RunResult) => {
            return result.video;
        })
        .filter(nonNull);
    if (videos.length === 0) {
        LOG.message(Level.WARNING, "No videos were uploaded: No videos have been captured");
    } else {
        await jiraClient.addAttachment(issueKey, ...videos);
    }
}
