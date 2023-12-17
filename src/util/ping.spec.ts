import { AxiosHeaders, AxiosResponse, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import Sinon from "sinon";
import { getMockedJWTCredentials, stubLogging, stubRequests } from "../../test/mocks";
import { JWTCredentials, PATCredentials } from "../authentication/credentials";
import { IUser } from "../types/jira/responses/user";
import { XrayLicenseStatus } from "../types/xray/responses/license";
import { dedent } from "./dedent";
import { pingJiraInstance, pingXrayCloud, pingXrayServer } from "./ping";

chai.use(chaiAsPromised);

describe("Jira instance ping", () => {
    it("returns true on success", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<IUser> = {
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
        await pingJiraInstance("https://example.org", new PATCredentials("token"));
    });

    it("returns false if no license data is returned", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<string> = {
            status: HttpStatusCode.Ok,
            data: "<div>Welcome</div>",
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedGet.resolves(response);
        await expect(
            pingJiraInstance("https://example.org", new PATCredentials("token"))
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to establish communication with Jira: https://example.org

                Jira did not return a valid response: JSON containing a username was expected, but not received

                Make sure you have correctly set up:
                - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Jira authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira

                For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
            `)
        );
    });

    it("returns false if user data is missing", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<IUser> = {
            status: HttpStatusCode.Ok,
            data: {
                active: true,
            },
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedGet.resolves(response);
        await expect(
            pingJiraInstance("https://example.org", new PATCredentials("token"))
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to establish communication with Jira: https://example.org

                Jira did not return a valid response: JSON containing a username was expected, but not received

                Make sure you have correctly set up:
                - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Jira authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira

                For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
            `)
        );
    });

    it("logs progress", async () => {
        const { stubbedGet } = stubRequests();
        const { stubbedInfo } = stubLogging();
        const clock = Sinon.useFakeTimers();
        const response: AxiosResponse<IUser> = {
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
        const promise = pingJiraInstance("https://example.org", new PATCredentials("token"));
        clock.tick(10000);
        await promise;
        expect(stubbedInfo).to.have.been.calledOnceWithExactly(
            "Waiting for https://example.org to respond... (10 seconds)"
        );
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
        await pingXrayServer("https://example.org", new PATCredentials("token"));
    });

    it("returns false if no license data is returned", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<string> = {
            status: HttpStatusCode.Ok,
            data: "<div>Welcome</div>",
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedGet.resolves(response);
        await expect(
            pingXrayServer("https://example.org", new PATCredentials("token"))
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to establish communication with Xray: https://example.org

                Xray did not return a valid response: JSON containing basic Xray license information was expected, but not received

                Make sure you have correctly set up:
                - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Xray server authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-server
                - Xray itself: https://docs.getxray.app/display/XRAY/Installation

                For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
            `)
        );
    });

    it("returns false if the license is not active", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<XrayLicenseStatus> = {
            status: HttpStatusCode.Ok,
            data: {
                active: false,
                licenseType: "Basic",
            },
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedGet.resolves(response);
        await expect(
            pingXrayServer("https://example.org", new PATCredentials("token"))
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to establish communication with Xray: https://example.org

                The Xray license is not active

                Make sure you have correctly set up:
                - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Xray server authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-server
                - Xray itself: https://docs.getxray.app/display/XRAY/Installation

                For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
            `)
        );
    });

    it("logs progress", async () => {
        const { stubbedGet } = stubRequests();
        const { stubbedInfo } = stubLogging();
        const clock = Sinon.useFakeTimers();
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
        const promise = pingXrayServer("https://example.org", new PATCredentials("token"));
        clock.tick(10000);
        await promise;
        expect(stubbedInfo).to.have.been.calledOnceWithExactly(
            "Waiting for https://example.org to respond... (10 seconds)"
        );
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
        const credentials = getMockedJWTCredentials();
        credentials.getAuthorizationHeader.resolves({ Authorization: "ey12345" });
        await pingXrayCloud(credentials);
    });

    it("returns false on failure", async () => {
        const { stubbedPost } = stubRequests();
        // Checked somewhere else.
        stubLogging();
        const response: AxiosResponse<string> = {
            status: HttpStatusCode.NotFound,
            data: "<div>Not Found</div>",
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.NotFound],
            config: { headers: new AxiosHeaders() },
        };
        stubbedPost.resolves(response);
        await expect(
            pingXrayCloud(new JWTCredentials("id", "secret", "https://example.org"))
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to establish communication with Xray: https://example.org

                Authentication failed

                Make sure you have correctly set up:
                - Xray cloud authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-cloud
                - Xray itself: https://docs.getxray.app/display/XRAYCLOUD/Installation

                For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
            `)
        );
    });
});
