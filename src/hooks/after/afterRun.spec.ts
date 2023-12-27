import { expect } from "chai";
import fs from "fs";
import { getMockedLogger } from "../../../test/mocks";
import { PatCredentials } from "../../authentication/credentials";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { initJiraOptions, initPluginOptions, initSslOptions, initXrayOptions } from "../../context";
import { Level } from "../../logging/logging";
import { resetPlugin } from "../../plugin";
import { CachingJiraFieldRepository } from "../../repository/jira/fields/jiraFieldRepository";
import { CachingJiraIssueFetcher } from "../../repository/jira/fields/jiraIssueFetcher";
import { CachingJiraRepository } from "../../repository/jira/jiraRepository";
import { PluginContext } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { ExecutableGraph } from "../../util/executable/executable";
import { onAfterRun } from "./afterRun";

describe(__filename, () => {
    describe(onAfterRun.name, () => {
        let config: Cypress.PluginConfigOptions;
        let pluginContext: PluginContext;

        beforeEach(() => {
            config = JSON.parse(
                fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
            ) as Cypress.PluginConfigOptions;
            const jiraClient = new JiraClientServer(
                "https://example.org",
                new PatCredentials("token")
            );
            const xrayClient = new XrayClientServer(
                "https://example.org",
                new PatCredentials("token")
            );
            const jiraOptions = initJiraOptions(
                {},
                {
                    projectKey: "CYP",
                    url: "https://example.org",
                }
            );
            const jiraFieldRepository = new CachingJiraFieldRepository(jiraClient);
            const jiraFieldFetcher = new CachingJiraIssueFetcher(
                jiraClient,
                jiraFieldRepository,
                jiraOptions.fields
            );
            const jiraRepository = new CachingJiraRepository(jiraFieldRepository, jiraFieldFetcher);
            pluginContext = {
                cypress: config,
                options: {
                    jira: jiraOptions,
                    plugin: initPluginOptions({}, {}),
                    xray: initXrayOptions({}, {}),
                    ssl: initSslOptions({}, {}),
                },
                clients: {
                    kind: "server",
                    jiraClient: jiraClient,
                    xrayClient: xrayClient,
                    jiraRepository: jiraRepository,
                },
                graph: new ExecutableGraph(),
            };
            resetPlugin();
        });

        it("displays an error for failed runs", async () => {
            const failedResults: CypressCommandLine.CypressFailedRunResult = {
                status: "failed",
                failures: 47,
                message: "Pretty messed up",
            };
            const logger = getMockedLogger();
            await onAfterRun(failedResults, pluginContext);
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.ERROR,
                dedent(`
                    Skipping after:run hook: Failed to run 47 tests

                    Pretty messed up
                `)
            );
        });
    });
});
