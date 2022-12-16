/// <reference types="cypress" />

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import {
    ENV_JIRA_PROJECT_KEY,
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
} from "../../../src/constants";
import { PLUGIN_CONTEXT, setContext } from "../../../src/context";
import { JWTCredentials } from "../../../src/credentials";
import { PluginContext } from "../../../src/types/xray/plugin";
import { CloudAPIUploader } from "../../../src/uploader/cloudAPI";
import { env } from "../helpers";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the cloud uploader", () => {
    beforeEach(() => {
        const context: PluginContext = {
            uploader: new CloudAPIUploader(
                new JWTCredentials(
                    env(ENV_XRAY_CLIENT_ID),
                    env(ENV_XRAY_CLIENT_SECRET)
                )
            ),
            jira: {
                projectKey: env(ENV_JIRA_PROJECT_KEY),
            },
            xray: {
                testType: "Manual",
            },
            config: {},
            openSSL: {},
        };
        setContext(context);
    });

    it("should be able to upload to fresh test execution issues using the cloud API", async () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const response = await PLUGIN_CONTEXT.uploader.uploadResults(result);
        expect(response.id).to.be.a("string");
        expect(response.key).to.be.a("string");
        expect(response.self).to.be.a("string");
    }).timeout(60000);

    it("should be able to upload to existing test execution issues using the cloud API", async () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        PLUGIN_CONTEXT.jira.testExecutionKey = "CYP-10";
        const response = await PLUGIN_CONTEXT.uploader.uploadResults(result);
        expect(response.key).to.eq("CYP-10");
    }).timeout(60000);

    it("should be able to upload to existing test execution issues and existing test issues using the cloud API", async () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync(
                "./test/resources/runResultExistingTestIssues.json",
                "utf-8"
            )
        );
        PLUGIN_CONTEXT.jira.testExecutionKey = "CYP-10";
        const response = await PLUGIN_CONTEXT.uploader.uploadResults(result);
        expect(response.key).to.eq("CYP-10");
        // TODO: assert that existing test issues were used
        // This could look like this:
        // 1) retrieve the test execution issue using the GraphQL API and the issueId of the results upload response
        //   a) retrieve the issueIds of its test cases (e.g. '10197', '10198', ...)
        //   b) retrieve the last modified date of its test cases
        //   - e.g.: query { getTestExecution(issueId: "12021") { issueId projectId tests(limit: 100) { results { issueId lastModified }}}}
        // 2) for each test case issueId, query the Jira API to retrieve:
        //   - the issue key (e.g. 'CYP-42', 'CYP-43', ...)
        // 3) check that all keys of the uploaded JSON appear here and that they were was last modified by this very upload test
    }).timeout(60000);

    it("should not be able to upload to non-existant test issue keys", async () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync(
                "./test/resources/runResultExistingTestIssuesKeyError.json",
                "utf-8"
            )
        );
        await expect(
            PLUGIN_CONTEXT.uploader.uploadResults(result)
        ).to.eventually.be.rejectedWith(
            'Failed to upload results to Xray Jira: "Test with key CYP-123456789101112131415 not found."'
        );
    }).timeout(120000); // It sometimes simply takes extremely long for Xray to respond.
});
