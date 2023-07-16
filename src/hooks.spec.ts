import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import dedent from "dedent";
import { readFileSync } from "fs";
import path from "path";
import { DummyJiraClient, DummyXrayClient, stubLogging, stubRequests } from "../test/util";
import { BasicAuthCredentials } from "./authentication/credentials";
import { JiraClientCloud } from "./client/jira/jiraClientCloud";
import { initOptions } from "./context";
import { afterRunHook, beforeRunHook, synchronizeFile } from "./hooks";
import { InternalOptions } from "./types/plugin";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the before run hook", () => {
    let beforeRunDetails: Cypress.BeforeRunDetails;
    let config: Cypress.PluginConfigOptions;
    let options: InternalOptions;

    beforeEach(() => {
        beforeRunDetails = JSON.parse(readFileSync("./test/resources/beforeRun.json", "utf-8"));
        config = JSON.parse(readFileSync("./test/resources/cypress.config.json", "utf-8"));
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
                cucumber: {
                    featureFileExtension: ".feature",
                },
            }
        );
        config.env["jsonEnabled"] = true;
        config.env["jsonOutput"] = "logs";
    });

    it("should throw if the plugin was not configured", async () => {
        const { stubbedError } = stubLogging();
        await beforeRunHook(config, beforeRunDetails);
        expect(stubbedError).to.have.been.calledOnceWith(
            dedent(`
                Plugin misconfigured: configureXrayPlugin() was not called. Skipping before:run hook
                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    });

    it("should not do anything if disabled", async () => {
        const { stubbedInfo } = stubLogging();
        options.plugin.enabled = false;
        await beforeRunHook(config, beforeRunDetails, options);
        expect(stubbedInfo).to.have.been.calledOnceWith(
            "Plugin disabled. Skipping before:run hook"
        );
    });

    it("should throw if the xray client was not configured", async () => {
        await expect(
            beforeRunHook(config, beforeRunDetails, options)
        ).to.eventually.be.rejectedWith(
            dedent(`
                Plugin misconfigured: Xray client was not configured
                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    });

    it("should throw if the jira client was not configured", async () => {
        await expect(
            beforeRunHook(config, beforeRunDetails, options, new DummyXrayClient())
        ).to.eventually.be.rejectedWith(
            dedent(`
                Plugin misconfigured: Jira client was not configured
                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    });

    it("should ignore the run details if the results upload is disabled", async () => {
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        options.xray.uploadResults = false;
        await beforeRunHook(
            config,
            beforeRunDetails,
            options,
            new DummyXrayClient(),
            new DummyJiraClient()
        );
        expect(options.cucumber.preprocessor).to.be.undefined;
    });

    it("should throw if the cucumber preprocessor json report is not enabled", async () => {
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        config.env["jsonEnabled"] = false;
        await expect(
            beforeRunHook(
                config,
                beforeRunDetails,
                options,
                new DummyXrayClient(),
                new DummyJiraClient()
            )
        ).to.eventually.be.rejectedWith(
            dedent(`
                Plugin misconfigured: Cucumber preprocessor JSON report disabled
                Make sure to enable the JSON report as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
            `)
        );
    });

    it("should throw if the cucumber preprocessor json report path was not set", async () => {
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        config.env["jsonOutput"] = "";
        await expect(
            beforeRunHook(
                config,
                beforeRunDetails,
                options,
                new DummyXrayClient(),
                new DummyJiraClient()
            )
        ).to.eventually.be.rejectedWith(
            dedent(`
                Plugin misconfigured: Cucumber preprocessor JSON report path was not set
                Make sure to configure the JSON report path as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
            `)
        );
    });

    it("should fetch xray issue type information to prepare for cucumber results upload", async () => {
        const { stubbedInfo } = stubLogging();
        const { stubbedGet } = stubRequests();
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        options.jira.testPlanIssueKey = "CYP-456";
        stubbedGet.onFirstCall().resolves({
            status: HttpStatusCode.Ok,
            data: [
                {
                    name: "Test Execution",
                    id: 12345,
                },
                {
                    name: "Test Plan",
                    id: 67890,
                },
            ],
            headers: null,
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: null,
        });
        await beforeRunHook(
            config,
            beforeRunDetails,
            options,
            new DummyXrayClient(),
            new JiraClientCloud("https://example.org", new BasicAuthCredentials("user", "token"))
        );
        expect(stubbedInfo).to.have.been.calledWith(
            "Fetching necessary Jira issue type information in preparation for Cucumber result uploads..."
        );
        expect(options.jira.testExecutionIssueDetails).to.deep.eq({
            name: "Test Execution",
            id: 12345,
        });
        expect(options.jira.testPlanIssueDetails).to.deep.eq({
            name: "Test Plan",
            id: 67890,
        });
    });

    it("should not fetch xray issue type information for native results upload", async () => {
        const { stubbedInfo } = stubLogging();
        beforeRunDetails = JSON.parse(readFileSync("./test/resources/beforeRun.json", "utf-8"));
        await beforeRunHook(
            config,
            beforeRunDetails,
            options,
            new DummyXrayClient(),
            new DummyJiraClient()
        );
        expect(stubbedInfo).to.not.have.been.called;
    });

    it("should throw if xray test execution issue type information can not be fetched", async () => {
        stubLogging();
        const { stubbedGet } = stubRequests();
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        options.jira.testExecutionIssueType = "Execution Issue";
        stubbedGet.onFirstCall().resolves({
            status: HttpStatusCode.Ok,
            data: [
                {
                    name: "Bug",
                    id: 67890,
                },
            ],
            headers: null,
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: null,
        });
        await expect(
            beforeRunHook(
                config,
                beforeRunDetails,
                options,
                new DummyXrayClient(),
                new JiraClientCloud(
                    "https://example.org",
                    new BasicAuthCredentials("user", "token")
                )
            )
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to retrieve issue type information for issue type: Execution Issue
                Make sure you have Xray installed.

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testPlanIssueType
            `)
        );
    });

    it("should throw if multiple xray test execution issue types are fetched", async () => {
        stubLogging();
        const { stubbedGet } = stubRequests();
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        options.jira.testExecutionIssueType = "Execution Issue";
        stubbedGet.onFirstCall().resolves({
            status: HttpStatusCode.Ok,
            data: [
                {
                    name: "Execution Issue",
                    id: 12345,
                },
                {
                    name: "Execution Issue",
                    id: 67890,
                },
            ],
            headers: null,
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: null,
        });
        await expect(
            beforeRunHook(
                config,
                beforeRunDetails,
                options,
                new DummyXrayClient(),
                new JiraClientCloud(
                    "https://example.org",
                    new BasicAuthCredentials("user", "token")
                )
            )
        ).to.eventually.be.rejectedWith(
            dedent(`
                Found multiple issue types named: Execution Issue
                Make sure to only make a single one available in project CYP.

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testPlanIssueType
            `)
        );
    });

    it("should throw if multiple xray test plan issue types are fetched", async () => {
        stubLogging();
        const { stubbedGet } = stubRequests();
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        options.jira.testPlanIssueKey = "CYP-456";
        stubbedGet.onFirstCall().resolves({
            status: HttpStatusCode.Ok,
            data: [
                {
                    name: "Test Execution",
                    id: 123,
                },
                {
                    name: "Test Plan",
                    id: 456,
                },
                {
                    name: "Test Plan",
                    id: 789,
                },
            ],
            headers: null,
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: null,
        });
        await expect(
            beforeRunHook(
                config,
                beforeRunDetails,
                options,
                new DummyXrayClient(),
                new JiraClientCloud(
                    "https://example.org",
                    new BasicAuthCredentials("user", "token")
                )
            )
        ).to.eventually.be.rejectedWith(
            dedent(`
                Found multiple issue types named: Test Plan
                Make sure to only make a single one available in project CYP.

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testPlanIssueType
            `)
        );
    });

    it("should throw if xray test plan issue type information can not be fetched", async () => {
        stubLogging();
        const { stubbedGet } = stubRequests();
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        options.jira.testPlanIssueKey = "CYP-456";
        options.jira.testPlanIssueType = "Plan Issue";
        stubbedGet.onFirstCall().resolves({
            status: HttpStatusCode.Ok,
            data: [
                {
                    name: "Test Execution",
                    id: 67890,
                },
            ],
            headers: null,
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: null,
        });
        await expect(
            beforeRunHook(
                config,
                beforeRunDetails,
                options,
                new DummyXrayClient(),
                new JiraClientCloud(
                    "https://example.org",
                    new BasicAuthCredentials("user", "token")
                )
            )
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to retrieve issue type information for issue type: Plan Issue
                Make sure you have Xray installed.

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testPlanIssueType
            `)
        );
    });

    it("should not fetch plan issue type information if not necessary", async () => {
        stubLogging();
        const { stubbedGet } = stubRequests();
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        stubbedGet.onFirstCall().resolves({
            status: HttpStatusCode.Ok,
            data: [
                {
                    name: "Test Execution",
                    id: 67890,
                },
            ],
            headers: null,
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: null,
        });
        await beforeRunHook(
            config,
            beforeRunDetails,
            options,
            new DummyXrayClient(),
            new JiraClientCloud("https://example.org", new BasicAuthCredentials("user", "token"))
        );
        expect(options.jira.testPlanIssueDetails).to.be.undefined;
    });

    it("should fetch plan issue type information only if necessary", async () => {
        stubLogging();
        const { stubbedGet } = stubRequests();
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        options.jira.testExecutionIssueDetails = {
            name: "Execution Type",
            subtask: false,
        };
        options.jira.testPlanIssueKey = "CYP-456";
        stubbedGet.onFirstCall().resolves({
            status: HttpStatusCode.Ok,
            data: [
                {
                    name: "Execution Type",
                    id: 12345,
                },
                {
                    name: "Test Plan",
                    id: 67890,
                },
            ],
            headers: null,
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: null,
        });
        await beforeRunHook(
            config,
            beforeRunDetails,
            options,
            new DummyXrayClient(),
            new JiraClientCloud("https://example.org", new BasicAuthCredentials("user", "token"))
        );
        expect(options.jira.testExecutionIssueDetails).to.be.deep.eq({
            name: "Execution Type",
            subtask: false,
        });
        expect(options.jira.testPlanIssueDetails).to.be.deep.eq({
            name: "Test Plan",
            id: 67890,
        });
    });

    it("should throw if jira issue type information cannot be fetched", async () => {
        stubLogging();
        const { stubbedGet } = stubRequests();
        beforeRunDetails = JSON.parse(
            readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
        );
        stubbedGet.onFirstCall().rejects(
            new AxiosError("Request failed with status code 404", "404", undefined, null, {
                status: 404,
                statusText: "NotFound",
                config: { headers: new AxiosHeaders() },
                headers: {},
                data: {
                    errorMessages: ["Project CYP does not exist"],
                },
            })
        );
        await expect(
            beforeRunHook(
                config,
                beforeRunDetails,
                options,
                new DummyXrayClient(),
                new JiraClientCloud(
                    "https://example.org",
                    new BasicAuthCredentials("user", "token")
                )
            )
        ).to.eventually.be.rejectedWith(
            dedent(`
                Jira issue type information could not be fetched.
                Please make sure project CYP exists at https://example.org

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#projectkey
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
            `)
        );
    });
});

describe("the after run hook", () => {
    let results: CypressCommandLine.CypressRunResult = JSON.parse(
        readFileSync("./test/resources/runResult.json", "utf-8")
    );

    let options: InternalOptions;

    beforeEach(() => {
        results = JSON.parse(readFileSync("./test/resources/runResult.json", "utf-8"));
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
            }
        );
    });

    it("should display errors if the plugin was not configured", async () => {
        const { stubbedError } = stubLogging();
        await afterRunHook(results);
        expect(stubbedError).to.have.been.calledOnce;
        expect(stubbedError).to.have.been.calledWith(
            dedent(`
                Plugin misconfigured: configureXrayPlugin() was not called. Skipping after:run hook
                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    });

    it("should not do anything if disabled", async () => {
        const { stubbedInfo } = stubLogging();
        options.plugin.enabled = false;
        await afterRunHook(results, options);
        expect(stubbedInfo).to.have.been.called.with.callCount(1);
        expect(stubbedInfo).to.have.been.calledWith("Plugin disabled. Skipping after:run hook");
    });

    it("should display an error for failed runs", async () => {
        const { stubbedError } = stubLogging();
        const failedResults: CypressCommandLine.CypressFailedRunResult = {
            status: "failed",
            failures: 47,
            message: "Pretty messed up",
        };
        await afterRunHook(failedResults, options);
        expect(stubbedError).to.have.been.calledOnce;
        expect(stubbedError).to.have.been.calledWith(
            "Aborting: failed to run 47 tests:",
            "Pretty messed up"
        );
    });

    it("should skip the results upload if disabled", async () => {
        const { stubbedInfo } = stubLogging();
        options.xray.uploadResults = false;
        await afterRunHook(results, options, new DummyXrayClient(), new DummyJiraClient());
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            "Skipping results upload: Plugin is configured to not upload test results"
        );
    });
});

describe("the synchronize file hook", () => {
    const file: Cypress.FileObject = {
        filePath: "./test/resources/features/taggedCloud.feature",
        outputPath: null,
        shouldWatch: false,
        addListener: null,
        on: null,
        once: null,
        removeListener: null,
        off: null,
        removeAllListeners: null,
        setMaxListeners: null,
        getMaxListeners: null,
        listeners: null,
        rawListeners: null,
        emit: null,
        listenerCount: null,
        prependListener: null,
        prependOnceListener: null,
        eventNames: null,
    };

    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
                cucumber: {
                    featureFileExtension: ".feature",
                },
            }
        );
    });

    it("should display errors if the plugin was not configured", async () => {
        const { stubbedError } = stubLogging();
        await synchronizeFile(file, ".");
        expect(stubbedError).to.have.been.calledOnce;
        expect(stubbedError).to.have.been.calledWith(
            dedent(`
                Plugin misconfigured (no configuration was provided). Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature
                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    });

    it("should not do anything if disabled", async () => {
        file.filePath = "./test/resources/features/taggedCloud.feature";
        const { stubbedInfo } = stubLogging();
        options.plugin = { enabled: false };
        await synchronizeFile(file, ".", options);
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
        );
    });

    it("should display errors for invalid feature files", async () => {
        file.filePath = "./test/resources/features/invalid.feature";
        const { stubbedInfo, stubbedError } = stubLogging();
        options.cucumber.uploadFeatures = true;
        await synchronizeFile(file, ".", options);
        expect(stubbedError).to.have.been.calledOnce;
        expect(stubbedError).to.have.been.calledWith(
            "Feature file invalid, skipping synchronization: Error: Parser errors:\n" +
                "(9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'"
        );
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            `Preprocessing feature file ${path.join(
                "test",
                "resources",
                "features",
                "invalid.feature"
            )}...`
        );
    });

    it("should not try to parse mismatched feature files", async () => {
        file.filePath = "./test/resources/greetings.txt";
        const { stubbedError } = stubLogging();
        await synchronizeFile(file, ".", options);
        expect(stubbedError).to.not.have.been.called;
    });
});
