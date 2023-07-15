/// <reference types="cypress" />

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import path from "path";
import { DummyJiraClient, DummyXrayClient, stubLogging } from "../test/util";
import { initOptions } from "./context";
import { afterRunHook, synchronizeFile } from "./hooks";
import { InternalOptions } from "./types/plugin";

// Enable promise assertions.
chai.use(chaiAsPromised);

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
            "Plugin misconfigured: configureXrayPlugin() was not called. Skipping after:run hook.\nMake sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    });

    it("should not do anything if disabled", async () => {
        const { stubbedInfo } = stubLogging();
        options.plugin.enabled = false;
        await afterRunHook(results, options);
        expect(stubbedInfo).to.have.been.called.with.callCount(1);
        expect(stubbedInfo).to.have.been.calledWith("Plugin disabled. Skipping after:run hook.");
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
            "Skipping results upload: Plugin is configured to not upload test results."
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
            "Plugin misconfigured (no configuration was provided). Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature\nMake sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
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
