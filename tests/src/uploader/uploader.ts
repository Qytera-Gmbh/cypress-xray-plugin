/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import {
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
    ENV_XRAY_EXECUTION_ISSUE_KEY,
    ENV_XRAY_PROJECT_KEY,
} from "../../../src/constants";
import { JWTCredentials } from "../../../src/credentials";
import { CloudAPIUploader } from "../../../src/uploader/cloudAPI";

function env(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(
            `Expected environment variable ${key} to not be undefined, which it was`
        );
    }
    return value as string;
}

describe("the uploaders", () => {
    let result: CypressCommandLine.CypressRunResult;

    beforeEach(() => {
        result = JSON.parse(
            readFileSync("./tests/resources/runResult.json", "utf-8")
        );
    });

    it("should be able to upload to fresh test execution issues using the cloud API", async () => {
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
        process.env[ENV_XRAY_EXECUTION_ISSUE_KEY] = "CYP-10";
        const response = await new CloudAPIUploader(
            new JWTCredentials(
                env(ENV_XRAY_CLIENT_ID),
                env(ENV_XRAY_CLIENT_SECRET)
            ),
            env(ENV_XRAY_PROJECT_KEY)
        ).uploadResults(result);
        expect(response.id).to.be.a("string");
        expect(response.key).to.eq("CYP-10");
        expect(response.self).to.be.a("string");
    }).timeout(60000);
});
