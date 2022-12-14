/// <reference types="cypress" />

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import {
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
    ENV_XRAY_EXECUTION_ISSUE_KEY,
    ENV_XRAY_PROJECT_KEY,
} from "../../../src/constants";
import { JWTCredentials } from "../../../src/credentials";
import { CloudAPIUploader } from "../../../src/uploader/cloudAPI";
import { env } from "../helpers";

chai.use(chaiAsPromised);

describe("the cloud uploader", () => {
    it("should be able to upload to fresh test execution issues using the cloud API", async () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./tests/resources/runResult.json", "utf-8")
        );
        const response = await new CloudAPIUploader(
            new JWTCredentials(
                env(ENV_XRAY_CLIENT_ID),
                env(ENV_XRAY_CLIENT_SECRET)
            ),
            env(ENV_XRAY_PROJECT_KEY)
        ).uploadResults(result);
        expect(response.id).to.be.a("string");
        expect(response.key).to.be.a("string");
        expect(response.self).to.be.a("string");
    }).timeout(60000);

    it("should be able to upload to existing test execution issues using the cloud API", async () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./tests/resources/runResult.json", "utf-8")
        );
        const issueKey = "CYP-10";
        process.env[ENV_XRAY_EXECUTION_ISSUE_KEY] = issueKey;
        const response = await new CloudAPIUploader(
            new JWTCredentials(
                env(ENV_XRAY_CLIENT_ID),
                env(ENV_XRAY_CLIENT_SECRET)
            ),
            env(ENV_XRAY_PROJECT_KEY)
        ).uploadResults(result);
        expect(response.id).to.be.a("string");
        expect(response.key).to.eq(issueKey);
        expect(response.self).to.be.a("string");
    }).timeout(60000);

    it.only(
        "should not be able to upload to non-existant test issue keys",
        async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync(
                    "./tests/resources/runResultExistingTestIssuesKeyError.json",
                    "utf-8"
                )
            );
            await expect(
                new CloudAPIUploader(
                    new JWTCredentials(
                        env(ENV_XRAY_CLIENT_ID),
                        env(ENV_XRAY_CLIENT_SECRET)
                    ),
                    env(ENV_XRAY_PROJECT_KEY)
                ).uploadResults(result)
            ).to.eventually.be.rejectedWith(
                'Failed to upload results to Xray Jira: "Test with key CYP-123456789101112131415 not found."'
            );
        }
    ).timeout(120000); // It sometimes simply takes extremely long for Xray to respond.
});
