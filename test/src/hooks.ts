/// <reference types="cypress" />

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import { CloudClient } from "../../src/client/cloudClient";
import { ServerClient } from "../../src/client/serverClient";
import {
    ENV_JIRA_PROJECT_KEY,
    ENV_XRAY_API_TOKEN,
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
    ENV_XRAY_PASSWORD,
    ENV_XRAY_USERNAME,
} from "../../src/constants";
import { CONTEXT, initContext } from "../../src/context";
import { beforeRunHook } from "../../src/hooks";
import { expectToExist } from "./helpers";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the before run hook", () => {
    let details: Cypress.BeforeRunDetails = JSON.parse(
        readFileSync("./test/resources/beforeRun.json", "utf-8")
    );

    beforeEach(() => {
        initContext({
            jira: {
                projectKey: "CYP",
            },
            xray: {
                testType: "Manual",
                uploadResults: true,
            },
            cucumber: {
                featureFileExtension: ".feature",
            },
        });
        details = JSON.parse(
            readFileSync("./test/resources/beforeRun.json", "utf-8")
        );
        // Set up cloud credentials for convenience purposes.
        details.config.env = {};
        details.config.env[ENV_XRAY_CLIENT_ID] = "user";
        details.config.env[ENV_XRAY_CLIENT_SECRET] = "xyz";
    });

    it("should be able to detect cloud credentials", async () => {
        await beforeRunHook(details);
        expect(CONTEXT.client).to.be.an.instanceof(CloudClient);
    });

    it("should be able to detect basic server credentials", async () => {
        details.config.env = {};
        details.config.env[ENV_XRAY_USERNAME] = "user";
        details.config.env[ENV_XRAY_PASSWORD] = "xyz";
        CONTEXT.config.jira.serverUrl = "https://example.org";
        await beforeRunHook(details);
        expect(CONTEXT.client).to.be.an.instanceof(ServerClient);
    });

    it("should be able to detect PAT server credentials", async () => {
        details.config.env = {};
        details.config.env[ENV_XRAY_USERNAME] = "user";
        details.config.env[ENV_XRAY_API_TOKEN] = "1337";
        CONTEXT.config.jira.serverUrl = "https://example.org";
        await beforeRunHook(details);
        expect(CONTEXT.client).to.be.an.instanceof(ServerClient);
    });

    it("should be able to choose cloud credentials over server credentials", async () => {
        details.config.env = {};
        details.config.env[ENV_XRAY_USERNAME] = "user";
        details.config.env[ENV_XRAY_PASSWORD] = "xyz";
        details.config.env[ENV_XRAY_API_TOKEN] = "1337";
        details.config.env[ENV_XRAY_CLIENT_ID] = "user";
        details.config.env[ENV_XRAY_CLIENT_SECRET] = "xyz";
        CONTEXT.config.jira.serverUrl = "https://example.org";
        await beforeRunHook(details);
        expect(CONTEXT.client).to.be.an.instanceof(CloudClient);
    });

    it("should be able to detect unset project keys", async () => {
        expectToExist(details.config.env);
        details.config.env[ENV_JIRA_PROJECT_KEY] = undefined;
        await expect(beforeRunHook(details)).to.eventually.be.rejectedWith(
            "Xray plugin misconfiguration: Jira project key was not set"
        );
    });

    it("should be able to detect mismatched test execution issue keys", async () => {
        CONTEXT.config.jira.testExecutionIssueKey = "ABC-123";
        await expect(beforeRunHook(details)).to.eventually.be.rejectedWith(
            "Xray plugin misconfiguration: test execution issue key ABC-123 does not belong to project CYP"
        );
    });

    it("should be able to detect mismatched test plan issue keys", async () => {
        CONTEXT.config.jira.testPlanIssueKey = "ABC-456";
        await expect(beforeRunHook(details)).to.eventually.be.rejectedWith(
            "Xray plugin misconfiguration: test plan issue key ABC-456 does not belong to project CYP"
        );
    });
});
