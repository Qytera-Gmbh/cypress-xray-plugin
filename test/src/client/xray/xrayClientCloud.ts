/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { JWTCredentials } from "../../../../src/authentication/credentials";
import { XrayClientCloud } from "../../../../src/client/xray/xrayClientCloud";
import { CONTEXT, initContext } from "../../../../src/context";
describe("the Xray cloud client", () => {
    let details: CypressCommandLine.CypressRunResult;
    let client: XrayClientCloud;

    beforeEach(() => {
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
        details = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        client = new XrayClientCloud(new JWTCredentials("user", "xyz"));
    });

    it("should be able to skip empty test uploads", async () => {
        details.runs.forEach((run, i) =>
            run.tests.forEach(
                (test, j) =>
                    (test.title = ["nothing", i.toString(), j.toString()])
            )
        );
        CONTEXT.config.jira.createTestIssues = false;
        const result = await client.importTestExecutionResults(details);
        expect(result).to.be.null;
    });
});
