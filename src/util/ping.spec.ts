import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { SinonStubbedInstance, useFakeTimers } from "sinon";
import { getMockedJwtCredentials, getMockedLogger, getMockedRestClient } from "../../test/mocks";
import { JwtCredentials, PatCredentials } from "../client/authentication/credentials";
import { AxiosRestClient } from "../client/https/requests";
import { dedent } from "./dedent";
import { Level } from "./logging";
import { pingJiraInstance, pingXrayCloud, pingXrayServer } from "./ping";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(pingJiraInstance.name, () => {
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
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        displayName: "Demo User",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
            await pingJiraInstance("https://example.org", new PatCredentials("token"), restClient);
        });

        it("returns false if no license data is returned", async () => {
            restClient.get.resolves({
                config: { headers: new AxiosHeaders() },
                data: "<div>Welcome</div>",
                headers: {},
                status: HttpStatusCode.Ok,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                config: { headers: new AxiosHeaders() },
                data: {
                    active: true,
                },
                headers: {},
                status: HttpStatusCode.Ok,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        displayName: "Demo User",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
            logger.message
                .withArgs(Level.INFO, "Waiting for https://example.org to respond... (10 seconds)")
                .onFirstCall()
                .returns();
            logger.message
                .withArgs(Level.DEBUG, "Pinging Jira instance...")
                .onFirstCall()
                .returns();
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

    describe(pingXrayServer.name, () => {
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
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        licenseType: "Demo License",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
            await pingXrayServer("https://example.org", new PatCredentials("token"), restClient);
        });

        it("returns false if no license data is returned", async () => {
            restClient.get.resolves({
                config: { headers: new AxiosHeaders() },
                data: "<div>Welcome</div>",
                headers: {},
                status: HttpStatusCode.Ok,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                config: { headers: new AxiosHeaders() },
                data: {
                    active: false,
                    licenseType: "Basic",
                },
                headers: {},
                status: HttpStatusCode.Ok,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        licenseType: "Demo License",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
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

    describe(pingXrayCloud.name, () => {
        let restClient: SinonStubbedInstance<AxiosRestClient>;

        beforeEach(() => {
            restClient = getMockedRestClient();
        });
        it("returns on success", async () => {
            restClient.post
                .withArgs("https://example.org", {
                    ["client_id"]: "user",
                    ["client_secret"]: "token",
                })
                .resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "ey.123.xyz",
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
            const credentials = getMockedJwtCredentials();
            credentials.getAuthorizationHeader.resolves({ ["Authorization"]: "ey12345" });
            await pingXrayCloud(credentials);
        });

        it("throws on failure", async () => {
            getMockedLogger({ allowUnstubbedCalls: true });
            restClient.post.onFirstCall().rejects(
                new AxiosError(
                    "Request failed with status code 404",
                    HttpStatusCode.BadRequest.toString(),
                    undefined,
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errorMessages: ["not found"],
                        },
                        headers: {},
                        status: HttpStatusCode.NotFound,
                        statusText: HttpStatusCode[HttpStatusCode.NotFound],
                    }
                )
            );
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
});
