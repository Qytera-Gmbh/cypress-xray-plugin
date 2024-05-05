import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs";
import { SinonStubbedInstance } from "sinon";
import { getMockedJwtCredentials, getMockedLogger, getMockedRestClient } from "../../../test/mocks";
import { AxiosRestClient } from "../../https/requests";
import { Level } from "../../logging/logging";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { CucumberMultipartInfo } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { GetTestsResponse } from "../../types/xray/responses/graphql/getTests";
import { dedent } from "../../util/dedent";
import { XrayClientCloud } from "./xrayClientCloud";

chai.use(chaiAsPromised);

describe("the xray cloud client", () => {
    let client: XrayClientCloud;
    let restClient: SinonStubbedInstance<AxiosRestClient>;

    beforeEach(() => {
        const credentials = getMockedJwtCredentials();
        credentials.getAuthorizationHeader.resolves({ ["Authorization"]: "ey12345" });
        restClient = getMockedRestClient();
        client = new XrayClientCloud(credentials, restClient);
    });

    describe("import execution", () => {
        it("should handle successful responses", async () => {
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    id: "12345",
                    key: "CYP-123",
                    self: "http://www.example.org/jira/rest/api/2/issue/12345",
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importExecution({
                testExecutionKey: "CYP-42",
                info: {
                    project: "CYP",
                    startDate: "2022-11-28T17:41:12Z",
                    finishDate: "2022-11-28T17:41:19Z",
                    description: "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)",
                    summary: "Test Execution Here",
                },
                tests: [
                    {
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:15Z",
                        status: "PASSED",
                    },
                    {
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:15Z",
                        status: "PASSED",
                    },
                    {
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:19Z",
                        status: "FAILED",
                    },
                ],
            });
            expect(response).to.eq("CYP-123");
        });
        it("handles bad responses", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const error = new AxiosError(
                "Request failed with status code 400",
                "400",
                { headers: new AxiosHeaders() },
                null,
                {
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "Must provide a project key",
                    },
                }
            );
            restClient.post.onFirstCall().rejects(error);
            const response = await client.importExecution({
                testExecutionKey: "CYP-42",
                info: {
                    startDate: "2022-11-28T17:41:12Z",
                    finishDate: "2022-11-28T17:41:19Z",
                    description: "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)",
                    summary: "Test Execution Here",
                },
                tests: [
                    {
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:15Z",
                        status: "PASSED",
                    },
                ],
            });
            expect(response).to.be.undefined;
            expect(logger.message).to.have.been.calledWithExactly(
                Level.ERROR,
                "Failed to import execution: Request failed with status code 400"
            );
            expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                error,
                "importExecutionError"
            );
        });
    });

    describe("import execution cucumber multipart", () => {
        it("should handle successful responses", async () => {
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    id: "12345",
                    key: "CYP-123",
                    self: "http://www.example.org/jira/rest/api/2/issue/12345",
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importExecutionCucumberMultipart(
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                        "utf-8"
                    )
                ) as CucumberMultipartFeature[],
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                        "utf-8"
                    )
                ) as CucumberMultipartInfo
            );
            expect(response).to.eq("CYP-123");
        });

        it("handles bad responses", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const error = new AxiosError(
                "Request failed with status code 400",
                "400",
                { headers: new AxiosHeaders() },
                null,
                {
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "There are no valid tests imported", // sic
                    },
                }
            );
            restClient.post.onFirstCall().rejects(error);
            const response = await client.importExecutionCucumberMultipart(
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                        "utf-8"
                    )
                ) as CucumberMultipartFeature[],
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                        "utf-8"
                    )
                ) as CucumberMultipartInfo
            );
            expect(response).to.be.undefined;
            expect(logger.message).to.have.been.calledWithExactly(
                Level.ERROR,
                "Failed to import Cucumber execution: Request failed with status code 400"
            );
            expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                error,
                "importExecutionCucumberMultipartError"
            );
        });
    });

    describe("import feature", () => {
        it("handles successful responses", async () => {
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    errors: [],
                    updatedOrCreatedTests: [
                        {
                            id: "32495",
                            key: "CYP-333",
                            self: "https://devxray3.atlassian.net/rest/api/2/issue/32495",
                        },
                        {
                            id: "32493",
                            key: "CYP-555",
                            self: "https://devxray3.atlassian.net/rest/api/2/issue/32493",
                        },
                    ],
                    updatedOrCreatedPreconditions: [
                        {
                            id: "12345",
                            key: "CYP-222",
                            self: "https://devxray3.atlassian.net/rest/api/2/issue/12345",
                        },
                    ],
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importFeature(
                "./test/resources/features/taggedPrefixCorrect.feature",
                "utf-8",
                "CYP"
            );
            expect(response).to.deep.eq({
                errors: [],
                updatedOrCreatedIssues: ["CYP-333", "CYP-555", "CYP-222"],
            });
        });

        it("handles responses with errors", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    errors: [
                        "Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!",
                        "Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!",
                    ],
                    updatedOrCreatedTests: [
                        {
                            id: "32493",
                            key: "CYP-555",
                            self: "https://devxray3.atlassian.net/rest/api/2/issue/32493",
                        },
                    ],
                    updatedOrCreatedPreconditions: [],
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importFeature(
                "./test/resources/features/taggedPrefixCorrect.feature",
                "utf-8",
                "CYP"
            );
            expect(response).to.deep.eq({
                errors: [
                    "Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!",
                    "Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!",
                ],
                updatedOrCreatedIssues: ["CYP-555"],
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.DEBUG,
                dedent(`
                    Encountered some errors during feature file import:
                    - Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!
                    - Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!
                `)
            );
        });

        it("handles responses without any updated issues", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    errors: [
                        "Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!",
                        "Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!",
                        "Error in file taggedPrefixCorrect.feature: Test with key CYP-555 was not found!",
                    ],
                    updatedOrCreatedTests: [],
                    updatedOrCreatedPreconditions: [],
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importFeature(
                "./test/resources/features/taggedPrefixCorrect.feature",
                "utf-8",
                "CYP"
            );
            expect(response).to.deep.eq({
                errors: [
                    "Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!",
                    "Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!",
                    "Error in file taggedPrefixCorrect.feature: Test with key CYP-555 was not found!",
                ],
                updatedOrCreatedIssues: [],
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.DEBUG,
                dedent(`
                    Encountered some errors during feature file import:
                    - Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!
                    - Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!
                    - Error in file taggedPrefixCorrect.feature: Test with key CYP-555 was not found!
                `)
            );
        });

        it("handles bad responses", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const error = new AxiosError(
                "Request failed with status code 400",
                "400",
                { headers: new AxiosHeaders() },
                null,
                {
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "There are no valid tests imported", // sic
                    },
                }
            );
            restClient.post.onFirstCall().rejects(error);
            await expect(
                client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    "utf-8",
                    "CYP"
                )
            ).to.eventually.be.rejectedWith("Feature file import failed");
            expect(logger.message).to.have.been.calledWithExactly(
                Level.ERROR,
                dedent(`
                    Failed to import Cucumber features: Request failed with status code 400

                    The prefixes in Cucumber background or scenario tags might be inconsistent with the scheme defined in Xray

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                `)
            );
            expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                error,
                "importFeatureError"
            );
        });
    });

    describe("get test types", () => {
        it("should handle successful responses", async () => {
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                        "utf-8"
                    )
                ),
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.deep.eq({
                ["CYP-330"]: "Generic",
                ["CYP-331"]: "Cucumber",
                ["CYP-332"]: "Manual",
            });
        });

        it("should paginate big requests", async () => {
            const mockedData: GetTestsResponse<unknown> = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                    "utf-8"
                )
            ) as GetTestsResponse<unknown>;
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    data: {
                        getTests: {
                            ...mockedData.data.getTests,
                            results: mockedData.data.getTests.results?.slice(0, 1),
                        },
                    },
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            restClient.post.onSecondCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    data: {
                        getTests: {
                            ...mockedData.data.getTests,
                            start: 1,
                            results: mockedData.data.getTests.results?.slice(1, 2),
                        },
                    },
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            restClient.post.onThirdCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    data: {
                        getTests: {
                            ...mockedData.data.getTests,
                            start: 2,
                            results: mockedData.data.getTests.results?.slice(2, 3),
                        },
                    },
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.deep.eq({
                ["CYP-330"]: "Generic",
                ["CYP-331"]: "Cucumber",
                ["CYP-332"]: "Manual",
            });
        });

        it("should throw for missing test types", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const mockedData: GetTestsResponse<unknown> = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                    "utf-8"
                )
            ) as GetTestsResponse<unknown>;
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    data: {
                        getTests: {
                            ...mockedData.data.getTests,
                            total: 1,
                            results: mockedData.data.getTests.results?.slice(1, 2),
                        },
                    },
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.ERROR,
                dedent(`
                    Failed to get test types: Failed to retrieve test types for issues:

                      CYP-331
                      CYP-332

                    Make sure these issues exist and are actually test issues
                `)
            );
        });

        it("should handle bad responses", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const error = new AxiosError(
                "Request failed with status code 400",
                "400",
                { headers: new AxiosHeaders() },
                null,
                {
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "Must provide a project key",
                    },
                }
            );
            restClient.post.onFirstCall().rejects(error);
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.ERROR,
                "Failed to get test types: Request failed with status code 400"
            );
            expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(error, "getTestTypes");
        });

        it("should skip empty issues", async () => {
            const logger = getMockedLogger();
            logger.message
                .withArgs(Level.WARNING, "No issue keys provided. Skipping test type retrieval")
                .onFirstCall()
                .returns();
            const response = await client.getTestTypes("CYP");
            expect(response).to.deep.eq({});
        });
    });

    describe("the urls", () => {
        describe("export cucumber", () => {
            it("keys", () => {
                expect(client.getUrlExportCucumber(["CYP-123", "CYP-456"])).to.eq(
                    "https://xray.cloud.getxray.app/api/v2/export/cucumber?keys=CYP-123;CYP-456"
                );
            });
            it("filter", () => {
                expect(client.getUrlExportCucumber(undefined, 56)).to.eq(
                    "https://xray.cloud.getxray.app/api/v2/export/cucumber?filter=56"
                );
            });
            it("keys and filter", () => {
                expect(client.getUrlExportCucumber(["CYP-123", "CYP-456"], 56)).to.eq(
                    "https://xray.cloud.getxray.app/api/v2/export/cucumber?keys=CYP-123;CYP-456&filter=56"
                );
            });
            it("neither keys nor filter", () => {
                expect(() => client.getUrlExportCucumber()).to.throw(
                    "One of issueKeys or filter must be provided to export feature files"
                );
            });
        });
        it("import execution", () => {
            expect(client.getUrlImportExecution()).to.eq(
                "https://xray.cloud.getxray.app/api/v2/import/execution"
            );
        });
        it("import feature", () => {
            expect(client.getUrlImportFeature("CYP")).to.eq(
                "https://xray.cloud.getxray.app/api/v2/import/feature?projectKey=CYP"
            );
        });
    });
});
