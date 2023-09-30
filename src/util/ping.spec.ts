import { AxiosHeaders, AxiosResponse, HttpStatusCode } from "axios";
import { expect } from "chai";
import { RESOLVED_JWT_CREDENTIALS, stubRequests } from "../../test/util";
import { PATCredentials } from "../authentication/credentials";
import { UserCloud, UserServer } from "../types/jira/responses/user";
import { XrayLicenseStatus } from "../types/xray/responses/license";
import { pingJiraInstance, pingXrayCloud, pingXrayServer } from "./ping";

describe("Jira instance ping", () => {
    it("returns true on success", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<UserServer | UserCloud> = {
            status: HttpStatusCode.Ok,
            data: {
                active: true,
                displayName: "Demo User",
            },
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedGet
            .callsFake((...args: unknown[]) => {
                throw new Error(`Cannot call GET stub with arguments: ${args}`);
            })
            .withArgs("https://example.org/rest/api/latest/myself", {
                headers: { Authorization: "Bearer token" },
            })
            .resolves(response);
        const pong = await pingJiraInstance("https://example.org", new PATCredentials("token"));
        expect(pong).to.be.true;
    });
});

describe("Xray server ping", () => {
    it("returns true on success", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<XrayLicenseStatus> = {
            status: HttpStatusCode.Ok,
            data: {
                active: true,
                licenseType: "Demo License",
            },
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedGet
            .callsFake((...args: unknown[]) => {
                throw new Error(`Cannot call GET stub with arguments: ${args}`);
            })
            .withArgs("https://example.org/rest/raven/latest/api/xraylicense", {
                headers: { Authorization: "Bearer token" },
            })
            .resolves(response);
        const pong = await pingXrayServer("https://example.org", new PATCredentials("token"));
        expect(pong).to.be.true;
    });
});

describe("Xray cloud ping", () => {
    it("returns true on success", async () => {
        const { stubbedPost } = stubRequests();
        const response: AxiosResponse<string> = {
            status: HttpStatusCode.Ok,
            data: "ey.123.xyz",
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedPost
            .callsFake((...args: unknown[]) => {
                throw new Error(`Cannot call POST stub with arguments: ${args}`);
            })
            .withArgs("https://example.org", {
                client_id: "user",
                client_secret: "token",
            })
            .resolves(response);
        const pong = await pingXrayCloud(RESOLVED_JWT_CREDENTIALS);
        expect(pong).to.be.true;
    });
});
