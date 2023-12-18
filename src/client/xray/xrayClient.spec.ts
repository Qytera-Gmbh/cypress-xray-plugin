import { expect } from "chai";
import { getMockedJWTCredentials, getMockedLogger } from "../../../test/mocks";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { Level } from "../../logging/logging";
import { IXrayClient } from "./xrayClient";
import { XrayClientCloud } from "./xrayClientCloud";
import { XrayClientServer } from "./xrayClientServer";

describe("the xray clients", () => {
    let client: IXrayClient;

    ["server", "cloud"].forEach((clientType: string) => {
        describe(clientType, () => {
            beforeEach(() => {
                const credentials = getMockedJWTCredentials();
                credentials.getAuthorizationHeader.resolves({ Authorization: "ey12345" });
                client =
                    clientType === "server"
                        ? new XrayClientServer(
                              "https://example.org",
                              new BasicAuthCredentials("user", "token")
                          )
                        : new XrayClientCloud(credentials);
            });

            describe("import execution", () => {
                it("should skip empty test uploads", async () => {
                    const logger = getMockedLogger();
                    logger.message
                        .withArgs(
                            Level.WARNING,
                            "No native Cypress tests were executed. Skipping native upload."
                        )
                        .onFirstCall()
                        .returns();
                    const result = await client.importExecution({});
                    expect(result).to.be.null;
                });
            });

            describe("import execution cucumber multipart", () => {
                it("should skip empty test uploads", async () => {
                    const logger = getMockedLogger();
                    logger.message
                        .withArgs(
                            Level.WARNING,
                            "No Cucumber tests were executed. Skipping Cucumber upload."
                        )
                        .onFirstCall()
                        .returns();
                    const response = await client.importExecutionCucumberMultipart([], {
                        fields: {
                            project: { key: "PRJ" },
                            summary: "summary",
                            issuetype: {
                                subtask: false,
                            },
                        },
                    });
                    expect(response).to.be.null;
                });
            });
        });
    });
});
