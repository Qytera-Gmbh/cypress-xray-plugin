import { expect } from "chai";
import { RESOLVED_JWT_CREDENTIALS, stubLogging } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { IXrayClient } from "./xrayClient";
import { XrayClientCloud } from "./xrayClientCloud";
import { XrayClientServer } from "./xrayClientServer";

describe("the xray clients", () => {
    let client: IXrayClient;

    ["server", "cloud"].forEach((clientType: string) => {
        describe(clientType, () => {
            beforeEach(() => {
                client =
                    clientType === "server"
                        ? new XrayClientServer(
                              "https://example.org",
                              new BasicAuthCredentials("user", "token")
                          )
                        : new XrayClientCloud(RESOLVED_JWT_CREDENTIALS);
            });

            describe("import execution", () => {
                it("should skip empty test uploads", async () => {
                    const { stubbedWarning } = stubLogging();
                    const result = await client.importExecution({});
                    expect(result).to.be.null;
                    expect(stubbedWarning).to.have.been.calledOnceWith(
                        "No native Cypress tests were executed. Skipping native upload."
                    );
                });
            });

            describe("import execution cucumber multipart", () => {
                it("should skip empty test uploads", async () => {
                    const { stubbedWarning } = stubLogging();
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
                    expect(stubbedWarning).to.have.been.calledWithExactly(
                        "No Cucumber tests were executed. Skipping Cucumber upload."
                    );
                });
            });
        });
    });
});
