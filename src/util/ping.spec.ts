import { AxiosHeaders, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SinonStubbedInstance, useFakeTimers } from "sinon";
import { getMockedJwtCredentials, getMockedLogger, getMockedRestClient } from "../../test/mocks";
import { JwtCredentials, PatCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { Level } from "../logging/logging";
import { dedent } from "./dedent";
import { pingJiraInstance, pingXrayCloud, pingXrayServer } from "./ping";

chai.use(chaiAsPromised);

describe("Jira instance ping", () => {
    let restClient: SinonStubbedInstance<AxiosRestClient>;

    beforeEach(() => {
        restClient = getMockedRestClient();
    });

    it("returns true on success", async () => {
        restClient.get
            .withArgs("https://example.org/rest/api/latest/myself", {
                headers: { ["Authorization"]: "Bearer token" },
            })
            .resolves({
                status: HttpStatusCode.Ok,
                data: {
                    active: true,
                    displayName: "Demo User",
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
        await pingJiraInstance("https://example.org", new PatCredentials("token"), restClient);
    });

    it("returns false if no license data is returned", async () => {
        restClient.get.resolves({
            status: HttpStatusCode.Ok,
            data: "<div>Welcome</div>",
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        });
        await expect(
            pingJiraInstance("https://example.org", new PatCredentials("token"), restClient)
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
        restClient.get.resolves({
            status: HttpStatusCode.Ok,
            data: {
                active: true,
            },
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        });
        await expect(
            pingJiraInstance("https://example.org", new PatCredentials("token"), restClient)
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
        const logger = getMockedLogger();
        const clock = useFakeTimers();
        restClient.get
            .withArgs("https://example.org/rest/api/latest/myself", {
                headers: { ["Authorization"]: "Bearer token" },
            })
            .resolves({
                status: HttpStatusCode.Ok,
                data: {
                    active: true,
                    displayName: "Demo User",
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
        logger.message
            .withArgs(Level.INFO, "Waiting for https://example.org to respond... (10 seconds)")
            .onFirstCall()
            .returns();
        logger.message.withArgs(Level.DEBUG, "Pinging Jira instance...").onFirstCall().returns();
        logger.message
            .withArgs(
                Level.DEBUG,
                dedent(`
                    Successfully established communication with: https://example.org
                    The provided Jira credentials belong to: Demo User
                `)
            )
            .onFirstCall()
            .returns();
        const promise = pingJiraInstance(
            "https://example.org",
            new PatCredentials("token"),
            restClient
        );
        clock.tick(10000);
        await promise;
    });
});

describe("Xray server ping", () => {
    let restClient: SinonStubbedInstance<AxiosRestClient>;

    beforeEach(() => {
        restClient = getMockedRestClient();
    });
    it("returns true on success", async () => {
        restClient.get
            .withArgs("https://example.org/rest/raven/latest/api/xraylicense", {
                headers: { ["Authorization"]: "Bearer token" },
            })
            .resolves({
                status: HttpStatusCode.Ok,
                data: {
                    active: true,
                    licenseType: "Demo License",
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
        await pingXrayServer("https://example.org", new PatCredentials("token"), restClient);
    });

    it("returns false if no license data is returned", async () => {
        restClient.get.resolves({
            status: HttpStatusCode.Ok,
            data: "<div>Welcome</div>",
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        });
        await expect(
            pingXrayServer("https://example.org", new PatCredentials("token"), restClient)
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
        restClient.get.resolves({
            status: HttpStatusCode.Ok,
            data: {
                active: false,
                licenseType: "Basic",
            },
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        });
        await expect(
            pingXrayServer("https://example.org", new PatCredentials("token"), restClient)
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
        const logger = getMockedLogger();
        const clock = useFakeTimers();
        restClient.get
            .withArgs("https://example.org/rest/raven/latest/api/xraylicense", {
                headers: { ["Authorization"]: "Bearer token" },
            })
            .resolves({
                status: HttpStatusCode.Ok,
                data: {
                    active: true,
                    licenseType: "Demo License",
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
        logger.message
            .withArgs(Level.INFO, "Waiting for https://example.org to respond... (10 seconds)")
            .onFirstCall()
            .returns();
        logger.message
            .withArgs(Level.DEBUG, "Pinging Xray server instance...")
            .onFirstCall()
            .returns();
        logger.message
            .withArgs(
                Level.DEBUG,
                dedent(`
                    Successfully established communication with: https://example.org
                    Xray license is active: Demo License
                `)
            )
            .onFirstCall()
            .returns();
        const promise = pingXrayServer(
            "https://example.org",
            new PatCredentials("token"),
            restClient
        );
        clock.tick(10000);
        await promise;
    });
});

describe("Xray cloud ping", () => {
    let restClient: SinonStubbedInstance<AxiosRestClient>;

    beforeEach(() => {
        restClient = getMockedRestClient();
    });
    it("returns true on success", async () => {
        restClient.post
            .withArgs("https://example.org", {
                ["client_id"]: "user",
                ["client_secret"]: "token",
            })
            .resolves({
                status: HttpStatusCode.Ok,
                data: "ey.123.xyz",
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
        const credentials = getMockedJwtCredentials();
        credentials.getAuthorizationHeader.resolves({ ["Authorization"]: "ey12345" });
        await pingXrayCloud(credentials);
    });

    it("returns false on failure", async () => {
        getMockedLogger({ allowUnstubbedCalls: true });
        restClient.post.onFirstCall().resolves({
            status: HttpStatusCode.NotFound,
            data: "<div>Not Found</div>",
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.NotFound],
            config: { headers: new AxiosHeaders() },
        });
        await expect(
            pingXrayCloud(new JwtCredentials("id", "secret", "https://example.org", restClient))
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
