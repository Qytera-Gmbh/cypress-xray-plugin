/// <reference types="cypress" />

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import {
    ENV_JIRA_PROJECT_KEY,
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
} from "../../src/constants";
import { CONTEXT, initContext } from "../../src/context";
import { beforeRunHook } from "../../src/hooks";
import { stubLogError, stubLogInfo } from "../constants";
import { expectToExist } from "./helpers";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the before run hook", () => {
    let details: Cypress.BeforeRunDetails = JSON.parse(
        readFileSync("./test/resources/beforeRun.json", "utf-8")
    );

    beforeEach(() => {
        // We're not interested in informative log messages here.
        stubLogInfo();
        initContext({
            jira: {
                projectKey: "CYP",
            },
            xray: {
                testType: "Manual",
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

    describe("the error handling", () => {
        it("should be able to detect unset project keys", async () => {
            expectToExist(details.config.env);
            CONTEXT.config.jira.projectKey = undefined;
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

        it("should not allow step lengths of length zero", async () => {
            expectToExist(CONTEXT.config.xray);
            CONTEXT.config.xray.steps = {
                maxLengthAction: 0,
            };
            await expect(beforeRunHook(details)).to.eventually.be.rejectedWith(
                "Xray plugin misconfiguration: max length of step actions must be a positive number: 0"
            );
        });

        it("should not allow negative step action lengths", async () => {
            expectToExist(CONTEXT.config.xray);
            CONTEXT.config.xray.steps = {
                maxLengthAction: -5,
            };
            await expect(beforeRunHook(details)).to.eventually.be.rejectedWith(
                "Xray plugin misconfiguration: max length of step actions must be a positive number: -5"
            );
        });

        it("should display errors for invalid feature files", async () => {
            details.specs[0].absolute = "./test/resources/features/invalid.feature";
            const stubbedError = stubLogError();
            await beforeRunHook(details);
            expect(stubbedError).to.have.been.called.with.callCount(1);
            expect(stubbedError).to.have.been.calledWith(
                'Feature file "./test/resources/features/invalid.feature" invalid, skipping synchronization: Error: Parser errors:\n' +
                    "(9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'"
            );
        });
    });

    it("should not try to parse mismatched feature files", async () => {
        details.specs[0].absolute = "./test/resources/greetings.txt";
        const stubbedError = stubLogError();
        await beforeRunHook(details);
        expect(stubbedError).to.not.have.been.called;
    });

    it("should be able to correctly parse feature files", async () => {
        details.specs[0].absolute = "./test/resources/features/taggedCloudExamples.feature";
        await beforeRunHook(details);
        expect(CONTEXT.config.cucumber.issues).to.have.property(
            "A tagged scenario with examples",
            "CYP-123"
        );
        expect(CONTEXT.config.cucumber.issues).to.have.property(
            "A tagged scenario with examples (example #1)",
            "CYP-123"
        );
        expect(CONTEXT.config.cucumber.issues).to.have.property(
            "A tagged scenario with examples (example #2)",
            "CYP-123"
        );
        expect(CONTEXT.config.cucumber.issues).to.have.property(
            "A tagged scenario with examples (example #3)",
            "CYP-123"
        );
    });
});
