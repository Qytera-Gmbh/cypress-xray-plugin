import { expect } from "chai";
import { RESOLVED_JWT_CREDENTIALS, stubLogging } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { XrayClientCloud } from "./xrayClientCloud";
import { XrayClientServer } from "./xrayClientServer";

describe("the xray clients", () => {
    let options: InternalOptions;
    let client: XrayClientServer | XrayClientCloud;

    ["server", "cloud"].forEach((clientType: string) => {
        describe(clientType, () => {
            beforeEach(() => {
                options = initOptions(
                    {},
                    {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            uploadResults: true,
                        },
                        cucumber: {
                            featureFileExtension: ".feature",
                        },
                    }
                );
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
        });
    });
});
