/// <reference types="cypress" />

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import { ENV_XRAY_CLIENT_ID, ENV_XRAY_CLIENT_SECRET } from "../../src/constants";
import { initOptions } from "../../src/context";
import { afterRunHook, synchronizeFile } from "../../src/hooks";
import { InternalOptions } from "../../src/types/plugin";
import { stubLogError, stubLogInfo } from "../constants";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the after run hook", () => {
    let results: CypressCommandLine.CypressRunResult = JSON.parse(
        readFileSync("./test/resources/runResult.json", "utf-8")
    );

    let options: InternalOptions;

    beforeEach(() => {
        results = JSON.parse(readFileSync("./test/resources/runResult.json", "utf-8"));
        options = initOptions({
            jira: {
                projectKey: "CYP",
            },
        });
    });

    it("should display errors if the plugin was not configured", async () => {
        const stubbedError = stubLogError();
        await afterRunHook(results);
        expect(stubbedError).to.have.been.calledTwice;
        expect(stubbedError).to.have.been.calledWith(
            "Plugin misconfigured (no configuration was provided). Skipping after:run hook."
        );
        expect(stubbedError).to.have.been.calledWith(
            "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    });

    it("should not do anything if disabled", async () => {
        const stubbedInfo = stubLogInfo();
        options.plugin.enabled = false;
        await afterRunHook(results, options);
        expect(stubbedInfo).to.have.been.called.with.callCount(1);
        expect(stubbedInfo).to.have.been.calledWith("Plugin disabled. Skipping after:run hook.");
    });

    it("should display an error for failed runs", async () => {
        const stubbedError = stubLogError();
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

    let details: Cypress.BeforeRunDetails = JSON.parse(
        readFileSync("./test/resources/beforeRun.json", "utf-8")
    );

    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions({
            jira: {
                projectKey: "CYP",
            },
            cucumber: {
                featureFileExtension: ".feature",
            },
        });
        details = JSON.parse(readFileSync("./test/resources/beforeRun.json", "utf-8"));
        // Set up cloud credentials for convenience purposes.
        details.config.env = {};
        details.config.env[ENV_XRAY_CLIENT_ID] = "user";
        details.config.env[ENV_XRAY_CLIENT_SECRET] = "xyz";
    });

    it("should display errors if the plugin was not configured", async () => {
        const stubbedError = stubLogError();
        await synchronizeFile(file, ".");
        expect(stubbedError).to.have.been.calledTwice;
        expect(stubbedError).to.have.been.calledWith(
            "Plugin misconfigured (no configuration was provided). Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
        );
        expect(stubbedError).to.have.been.calledWith(
            "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    });

    it("should not do anything if disabled", async () => {
        file.filePath = "./test/resources/features/taggedCloud.feature";
        const stubbedInfo = stubLogInfo();
        options.plugin = { enabled: false };
        await synchronizeFile(file, ".", options);
        expect(stubbedInfo).to.have.been.called.with.callCount(1);
        expect(stubbedInfo).to.have.been.calledWith(
            "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
        );
    });

    it("should display errors for invalid feature files", async () => {
        file.filePath = "./test/resources/features/invalid.feature";
        const stubbedError = stubLogError();
        const stubbedInfo = stubLogInfo();
        await synchronizeFile(file, ".", options);
        expect(stubbedError).to.have.been.called.with.callCount(1);
        expect(stubbedError).to.have.been.calledWith(
            'Feature file "./test/resources/features/invalid.feature" invalid, skipping synchronization: Error: Parser errors:\n' +
                "(9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'"
        );
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            "Preprocessing feature file test\\resources\\features\\invalid.feature..."
        );
    });

    it("should not try to parse mismatched feature files", async () => {
        file.filePath = "./test/resources/greetings.txt";
        const stubbedError = stubLogError();
        await synchronizeFile(file, ".", options);
        expect(stubbedError).to.not.have.been.called;
    });

    it("should be able to correctly parse feature files", async () => {
        file.filePath = "./test/resources/features/taggedCloud.feature";
        const stubbedInfo = stubLogInfo();
        await synchronizeFile(file, ".", options);
        expect(options.cucumber.issues).to.deep.equal({ "A tagged scenario": "CYP-857" });
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            "Preprocessing feature file test\\resources\\features\\taggedCloud.feature..."
        );
    });

    it("should be able to correctly parse feature files with examples", async () => {
        file.filePath = "./test/resources/features/taggedCloudExamples.feature";
        const stubbedInfo = stubLogInfo();
        await synchronizeFile(file, ".", options);
        expect(options.cucumber.issues).to.deep.equal({
            "A tagged scenario with examples": "CYP-123",
            "A tagged scenario with examples (example #1)": "CYP-123",
            "A tagged scenario with examples (example #2)": "CYP-123",
            "A tagged scenario with examples (example #3)": "CYP-123",
        });
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            "Preprocessing feature file test\\resources\\features\\taggedCloudExamples.feature..."
        );
    });
});
