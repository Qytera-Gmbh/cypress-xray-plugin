/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { stubLogWarning } from "../../../test/util";
import { JWTCredentials } from "../../authentication/credentials";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { XrayClientCloud } from "./xrayClientCloud";

describe("the Xray cloud client", () => {
    let details: CypressCommandLine.CypressRunResult;
    let client: XrayClientCloud;

    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions({
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
        details = JSON.parse(readFileSync("./test/resources/runResult.json", "utf-8"));
    });

    it("should be able to skip empty test uploads", async () => {
        details.runs.forEach((run, i) =>
            run.tests.forEach((test, j) => (test.title = ["nothing", i.toString(), j.toString()]))
        );
        options.jira.createTestIssues = false;
        client = new XrayClientCloud(new JWTCredentials("user", "xyz"), options);
        const stubbedWarning = stubLogWarning();
        const result = await client.importTestExecutionResults(details);
        expect(result).to.be.null;
        expect(stubbedWarning).to.have.been.called.with.callCount(4);
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "nothing 0 0".'
        );
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "nothing 0 1".'
        );
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "nothing 0 2".'
        );
        expect(stubbedWarning).to.have.been.calledWith(
            "No tests linked to Xray were executed. Skipping upload."
        );
    });
});
