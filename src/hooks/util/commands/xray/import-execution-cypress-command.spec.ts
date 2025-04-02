import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { JwtCredentials, PatCredentials } from "../../../../client/authentication/credentials";
import { AxiosRestClient } from "../../../../client/https/requests";
import type { XrayClient } from "../../../../client/xray/xray-client";
import { XrayClientCloud } from "../../../../client/xray/xray-client-cloud";
import { ServerClient } from "../../../../client/xray/xray-client-server";
import { PluginEventEmitter } from "../../../../context";
import type { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results";
import type { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info";
import type { GetTestRunResponseServer } from "../../../../types/xray/responses/graphql/get-test-runs";
import { LOG } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { ImportExecutionCypressCommand } from "./import-execution-cypress-command";

describe(relative(cwd(), __filename), async () => {
    await describe(ImportExecutionCypressCommand.name, async () => {
        await it("imports cypress xray json", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const results: XrayTestExecutionResults = {
                info: { description: "Hello", summary: "Test Execution Summary" },
                testExecutionKey: "CYP-123",
                tests: [
                    { status: "PASSED" },
                    { status: "PASSED" },
                    { status: "PASSED" },
                    { status: "FAILED" },
                ],
            };
            const info: MultipartInfo = {
                fields: {
                    issuetype: {
                        id: "10008",
                    },
                    labels: ["a", "b"],
                    project: {
                        key: "CYP",
                    },
                    summary: "Brand new Test execution",
                },
            };
            const xrayClient = new ServerClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                xrayClient,
                "importExecutionMultipart",
                context.mock.fn<XrayClient["importExecutionMultipart"]>(
                    (executionResults, executionInfo) => {
                        if (executionResults === results && executionInfo === info) {
                            return Promise.resolve("CYP-123");
                        }
                        return Promise.reject(new Error("Mock called unexpectedly"));
                    }
                )
            );
            const command = new ImportExecutionCypressCommand(
                {
                    emitter: new PluginEventEmitter(),
                    splitUpload: false,
                    xrayClient: xrayClient,
                },
                LOG,
                new ConstantCommand(LOG, [results, info])
            );
            assert.strictEqual(await command.compute(), "CYP-123");
            assert.strictEqual(message.mock.callCount(), 0);
        });

        describe("splits evidence uploads into multiple requests", async () => {
            await it("server", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const results: XrayTestExecutionResults = {
                    info: { description: "Hello", summary: "Test Execution Summary" },
                    testExecutionKey: "CYP-123",
                    tests: [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("first").toString("base64"),
                                    filename: "first.txt",
                                },
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("second").toString("base64"),
                                    filename: "second.txt",
                                },
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("third").toString("base64"),
                                    filename: "third.txt",
                                },
                            ],
                            status: "PASSED",
                            testKey: "CYP-456",
                        },
                    ],
                };
                const info: MultipartInfo = {
                    fields: {
                        issuetype: {
                            id: "10008",
                        },
                        project: {
                            key: "CYP",
                        },
                        summary: "Brand new Test execution",
                    },
                };
                const xrayClient = new ServerClient(
                    "http://localhost:1234",
                    new PatCredentials("token"),
                    new AxiosRestClient(axios)
                );
                const importExecutionMultipartCallArgs: Parameters<
                    ServerClient["importExecutionMultipart"]
                >[] = [];
                context.mock.method(
                    xrayClient,
                    "importExecutionMultipart",
                    context.mock.fn<ServerClient["importExecutionMultipart"]>(
                        (executionResults, executionInfo) => {
                            importExecutionMultipartCallArgs.push([
                                executionResults,
                                executionInfo,
                            ]);
                            return Promise.resolve("CYP-123");
                        }
                    )
                );
                const getTestRunCallArgs: Parameters<ServerClient["getTestRun"]>[] = [];
                context.mock.method(
                    xrayClient,
                    "getTestRun",
                    context.mock.fn<ServerClient["getTestRun"]>((args) => {
                        getTestRunCallArgs.push([args]);
                        return Promise.resolve({
                            id: "123456789",
                        } as unknown as GetTestRunResponseServer);
                    })
                );
                const addEvidenceCallArgs: Parameters<ServerClient["addEvidence"]>[] = [];
                context.mock.method(
                    xrayClient,
                    "addEvidence",
                    context.mock.fn<ServerClient["addEvidence"]>((testRunId, body) => {
                        addEvidenceCallArgs.push([testRunId, body]);
                        return Promise.resolve();
                    })
                );
                const command = new ImportExecutionCypressCommand(
                    {
                        emitter: new PluginEventEmitter(),
                        splitUpload: true,
                        xrayClient: xrayClient,
                    },
                    LOG,
                    new ConstantCommand(LOG, [results, info])
                );
                assert.strictEqual(await command.compute(), "CYP-123");
                assert.strictEqual(message.mock.callCount(), 0);
                assert.deepStrictEqual(importExecutionMultipartCallArgs, [
                    [
                        {
                            info: { description: "Hello", summary: "Test Execution Summary" },
                            testExecutionKey: "CYP-123",
                            tests: [{ status: "PASSED", testKey: "CYP-456" }],
                        },
                        {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                    ],
                ]);
                assert.deepStrictEqual(getTestRunCallArgs, [
                    [{ testExecIssueKey: "CYP-123", testIssueKey: "CYP-456" }],
                ]);
                assert.deepStrictEqual(addEvidenceCallArgs, [
                    [
                        "123456789",
                        { contentType: "text/plain", data: "Zmlyc3Q=", filename: "first.txt" },
                    ],
                    [
                        "123456789",
                        { contentType: "text/plain", data: "c2Vjb25k", filename: "second.txt" },
                    ],
                    [
                        "123456789",
                        { contentType: "text/plain", data: "dGhpcmQ=", filename: "third.txt" },
                    ],
                ]);
            });

            await it("cloud", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const results: XrayTestExecutionResults = {
                    info: { description: "Hello", summary: "Test Execution Summary" },
                    testExecutionKey: "CYP-123",
                    tests: [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("first").toString("base64"),
                                    filename: "first.txt",
                                },
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("second").toString("base64"),
                                    filename: "second.txt",
                                },
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("third").toString("base64"),
                                    filename: "third.txt",
                                },
                            ],
                            status: "PASSED",
                            testKey: "CYP-456",
                        },
                    ],
                };
                const info: MultipartInfo = {
                    fields: {
                        issuetype: {
                            id: "10008",
                        },
                        project: {
                            key: "CYP",
                        },
                        summary: "Brand new Test execution",
                    },
                };
                const restClient = new AxiosRestClient(axios);
                const credentials = new JwtCredentials(
                    "abc",
                    "xyz",
                    "http://localhost:1234",
                    restClient
                );
                context.mock.method(credentials, "getAuthorizationHeader", () => {
                    return { ["Authorization"]: "ey12345" };
                });
                const xrayClient = new XrayClientCloud(credentials, restClient);
                const importExecutionMultipartCallArgs: Parameters<
                    XrayClientCloud["importExecutionMultipart"]
                >[] = [];
                context.mock.method(
                    xrayClient,
                    "importExecutionMultipart",
                    context.mock.fn<XrayClientCloud["importExecutionMultipart"]>(
                        (executionResults, executionInfo) => {
                            importExecutionMultipartCallArgs.push([
                                executionResults,
                                executionInfo,
                            ]);
                            return Promise.resolve("CYP-123");
                        }
                    )
                );
                const getTestRunResultsCallArgs: Parameters<
                    XrayClientCloud["getTestRunResults"]
                >[] = [];
                context.mock.method(
                    xrayClient,
                    "getTestRunResults",
                    context.mock.fn<XrayClientCloud["getTestRunResults"]>((args) => {
                        getTestRunResultsCallArgs.push([args]);
                        return Promise.resolve([{ id: "123456789" }]);
                    })
                );
                const addEvidenceToTestRunCallArgs: Parameters<
                    XrayClientCloud["addEvidenceToTestRun"]
                >[] = [];
                context.mock.method(
                    xrayClient,
                    "addEvidenceToTestRun",
                    context.mock.fn<XrayClientCloud["addEvidenceToTestRun"]>((args) => {
                        addEvidenceToTestRunCallArgs.push([args]);
                        return Promise.resolve({ addedEvidence: [], warnings: [] });
                    })
                );
                const command = new ImportExecutionCypressCommand(
                    {
                        emitter: new PluginEventEmitter(),
                        splitUpload: true,
                        xrayClient: xrayClient,
                    },
                    LOG,
                    new ConstantCommand(LOG, [results, info])
                );
                assert.strictEqual(await command.compute(), "CYP-123");
                assert.strictEqual(message.mock.callCount(), 0);
                assert.deepStrictEqual(importExecutionMultipartCallArgs, [
                    [
                        {
                            info: { description: "Hello", summary: "Test Execution Summary" },
                            testExecutionKey: "CYP-123",
                            tests: [{ status: "PASSED", testKey: "CYP-456" }],
                        },
                        {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                    ],
                ]);
                assert.deepStrictEqual(getTestRunResultsCallArgs, [
                    [{ testExecIssueIds: ["CYP-123"], testIssueIds: ["CYP-456"] }],
                ]);
                assert.deepStrictEqual(addEvidenceToTestRunCallArgs, [
                    [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: "Zmlyc3Q=",
                                    filename: "first.txt",
                                },
                            ],
                            id: "123456789",
                        },
                    ],
                    [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: "c2Vjb25k",
                                    filename: "second.txt",
                                },
                            ],
                            id: "123456789",
                        },
                    ],
                    [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: "dGhpcmQ=",
                                    filename: "third.txt",
                                },
                            ],
                            id: "123456789",
                        },
                    ],
                ]);
            });
        });

        it("emits the upload event", async (context) => {
            const results: XrayTestExecutionResults = {
                info: { description: "Hello", summary: "Test Execution Summary" },
                testExecutionKey: "CYP-123",
                tests: [{ status: "PASSED", testKey: "CYP-456" }],
            };
            const info: MultipartInfo = {
                fields: {
                    issuetype: { id: "10008" },
                    project: { key: "CYP" },
                    summary: "Brand new Test execution",
                },
            };
            const xrayClient = new ServerClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                xrayClient,
                "importExecutionMultipart",
                context.mock.fn<ServerClient["importExecutionMultipart"]>(() => {
                    return Promise.resolve("CYP-123");
                })
            );
            const emitter = new PluginEventEmitter();
            let payload = {};
            emitter.on("upload:cypress", (data) => {
                payload = data;
            });
            const command = new ImportExecutionCypressCommand(
                {
                    emitter: emitter,
                    splitUpload: false,
                    xrayClient: xrayClient,
                },
                LOG,
                new ConstantCommand(LOG, [results, info])
            );
            await command.compute();
            assert.deepStrictEqual(payload, {
                info: {
                    fields: {
                        issuetype: { id: "10008" },
                        project: { key: "CYP" },
                        summary: "Brand new Test execution",
                    },
                },
                results: {
                    info: { description: "Hello", summary: "Test Execution Summary" },
                    testExecutionKey: "CYP-123",
                    tests: [{ status: "PASSED", testKey: "CYP-456" }],
                },
                testExecutionIssueKey: "CYP-123",
            });
        });

        describe("splits evidence uploads into multiple sequential requests", async () => {
            await it("server", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const results: XrayTestExecutionResults = {
                    info: { description: "Hello", summary: "Test Execution Summary" },
                    testExecutionKey: "CYP-123",
                    tests: [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("first").toString("base64"),
                                    filename: "first.txt",
                                },
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("second").toString("base64"),
                                    filename: "second.txt",
                                },
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("third").toString("base64"),
                                    filename: "third.txt",
                                },
                            ],
                            status: "PASSED",
                            testKey: "CYP-456",
                        },
                    ],
                };
                const info: MultipartInfo = {
                    fields: {
                        issuetype: {
                            id: "10008",
                        },
                        project: {
                            key: "CYP",
                        },
                        summary: "Brand new Test execution",
                    },
                };
                const xrayClient = new ServerClient(
                    "http://localhost:1234",
                    new PatCredentials("token"),
                    new AxiosRestClient(axios)
                );
                const importExecutionMultipartCallArgs: Parameters<
                    ServerClient["importExecutionMultipart"]
                >[] = [];
                context.mock.method(
                    xrayClient,
                    "importExecutionMultipart",
                    context.mock.fn<ServerClient["importExecutionMultipart"]>(
                        (executionResults, executionInfo) => {
                            importExecutionMultipartCallArgs.push([
                                executionResults,
                                executionInfo,
                            ]);
                            return Promise.resolve("CYP-123");
                        }
                    )
                );
                const getTestRunCallArgs: Parameters<ServerClient["getTestRun"]>[] = [];
                context.mock.method(
                    xrayClient,
                    "getTestRun",
                    context.mock.fn<ServerClient["getTestRun"]>((args) => {
                        getTestRunCallArgs.push([args]);
                        return Promise.resolve({
                            id: "123456789",
                        } as unknown as GetTestRunResponseServer);
                    })
                );
                const addEvidenceCallArgs: Parameters<ServerClient["addEvidence"]>[] = [];
                context.mock.method(
                    xrayClient,
                    "addEvidence",
                    context.mock.fn<ServerClient["addEvidence"]>((testRunId, body) => {
                        addEvidenceCallArgs.push([testRunId, body]);
                        return Promise.resolve();
                    })
                );
                const command = new ImportExecutionCypressCommand(
                    {
                        emitter: new PluginEventEmitter(),
                        splitUpload: "sequential",
                        xrayClient: xrayClient,
                    },
                    LOG,
                    new ConstantCommand(LOG, [results, info])
                );
                assert.strictEqual(await command.compute(), "CYP-123");
                assert.strictEqual(message.mock.callCount(), 0);
                assert.deepStrictEqual(importExecutionMultipartCallArgs, [
                    [
                        {
                            info: { description: "Hello", summary: "Test Execution Summary" },
                            testExecutionKey: "CYP-123",
                            tests: [{ status: "PASSED", testKey: "CYP-456" }],
                        },
                        {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                    ],
                ]);
                assert.deepStrictEqual(getTestRunCallArgs, [
                    [{ testExecIssueKey: "CYP-123", testIssueKey: "CYP-456" }],
                ]);
                assert.deepStrictEqual(addEvidenceCallArgs, [
                    [
                        "123456789",
                        { contentType: "text/plain", data: "Zmlyc3Q=", filename: "first.txt" },
                    ],
                    [
                        "123456789",
                        { contentType: "text/plain", data: "c2Vjb25k", filename: "second.txt" },
                    ],
                    [
                        "123456789",
                        { contentType: "text/plain", data: "dGhpcmQ=", filename: "third.txt" },
                    ],
                ]);
            });

            await it("cloud", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const results: XrayTestExecutionResults = {
                    info: { description: "Hello", summary: "Test Execution Summary" },
                    testExecutionKey: "CYP-123",
                    tests: [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("first").toString("base64"),
                                    filename: "first.txt",
                                },
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("second").toString("base64"),
                                    filename: "second.txt",
                                },
                                {
                                    contentType: "text/plain",
                                    data: Buffer.from("third").toString("base64"),
                                    filename: "third.txt",
                                },
                            ],
                            status: "PASSED",
                            testKey: "CYP-456",
                        },
                    ],
                };
                const info: MultipartInfo = {
                    fields: {
                        issuetype: {
                            id: "10008",
                        },
                        project: {
                            key: "CYP",
                        },
                        summary: "Brand new Test execution",
                    },
                };
                const restClient = new AxiosRestClient(axios);
                const credentials = new JwtCredentials(
                    "abc",
                    "xyz",
                    "http://localhost:1234",
                    restClient
                );
                context.mock.method(credentials, "getAuthorizationHeader", () => {
                    return { ["Authorization"]: "ey12345" };
                });
                const xrayClient = new XrayClientCloud(credentials, restClient);
                const importExecutionMultipartCallArgs: Parameters<
                    XrayClientCloud["importExecutionMultipart"]
                >[] = [];
                context.mock.method(
                    xrayClient,
                    "importExecutionMultipart",
                    context.mock.fn<XrayClientCloud["importExecutionMultipart"]>(
                        (executionResults, executionInfo) => {
                            importExecutionMultipartCallArgs.push([
                                executionResults,
                                executionInfo,
                            ]);
                            return Promise.resolve("CYP-123");
                        }
                    )
                );
                const getTestRunResultsCallArgs: Parameters<
                    XrayClientCloud["getTestRunResults"]
                >[] = [];
                context.mock.method(
                    xrayClient,
                    "getTestRunResults",
                    context.mock.fn<XrayClientCloud["getTestRunResults"]>((args) => {
                        getTestRunResultsCallArgs.push([args]);
                        return Promise.resolve([{ id: "123456789" }]);
                    })
                );
                const addEvidenceToTestRunCallArgs: Parameters<
                    XrayClientCloud["addEvidenceToTestRun"]
                >[] = [];
                context.mock.method(
                    xrayClient,
                    "addEvidenceToTestRun",
                    context.mock.fn<XrayClientCloud["addEvidenceToTestRun"]>((args) => {
                        addEvidenceToTestRunCallArgs.push([args]);
                        return Promise.resolve({ addedEvidence: [], warnings: [] });
                    })
                );
                const command = new ImportExecutionCypressCommand(
                    {
                        emitter: new PluginEventEmitter(),
                        splitUpload: "sequential",
                        xrayClient: xrayClient,
                    },
                    LOG,
                    new ConstantCommand(LOG, [results, info])
                );
                assert.strictEqual(await command.compute(), "CYP-123");
                assert.strictEqual(message.mock.callCount(), 0);
                assert.deepStrictEqual(importExecutionMultipartCallArgs, [
                    [
                        {
                            info: { description: "Hello", summary: "Test Execution Summary" },
                            testExecutionKey: "CYP-123",
                            tests: [{ status: "PASSED", testKey: "CYP-456" }],
                        },
                        {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                    ],
                ]);
                assert.deepStrictEqual(getTestRunResultsCallArgs, [
                    [{ testExecIssueIds: ["CYP-123"], testIssueIds: ["CYP-456"] }],
                ]);
                assert.deepStrictEqual(addEvidenceToTestRunCallArgs, [
                    [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: "Zmlyc3Q=",
                                    filename: "first.txt",
                                },
                            ],
                            id: "123456789",
                        },
                    ],
                    [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: "c2Vjb25k",
                                    filename: "second.txt",
                                },
                            ],
                            id: "123456789",
                        },
                    ],
                    [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: "dGhpcmQ=",
                                    filename: "third.txt",
                                },
                            ],
                            id: "123456789",
                        },
                    ],
                ]);
            });
        });
    });
});
