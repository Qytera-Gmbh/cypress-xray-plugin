/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import {
    ENV_PROJECT_KEY,
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
} from "../../../src/constants";
import { JWTCredentials } from "../../../src/credentials";
import { CloudAPIUploader } from "../../../src/uploader/cloudAPI";

describe("the uploaders", () => {
    let result: CypressCommandLine.CypressRunResult;

    before(() => {
        result = JSON.parse(
            readFileSync("./tests/resources/runResult.json", "utf-8")
        );
    });

    it("should be able to upload using the cloud API", async () => {
        const clientId = process.env[ENV_XRAY_CLIENT_ID];
        const clientSecret = process.env[ENV_XRAY_CLIENT_SECRET];
        const projectKey = process.env[ENV_PROJECT_KEY];
        expect(clientId).to.not.be.undefined;
        expect(clientSecret).to.not.be.undefined;
        expect(projectKey).to.not.be.undefined;
        const response = await new CloudAPIUploader(
            new JWTCredentials(clientId as string, clientSecret as string),
            projectKey as string
        ).uploadResults(result);
        expect(response.id).to.be.a("string");
        expect(response.key).to.be.a("string");
        expect(response.self).to.be.a("string");
    }).timeout(60000);
});
