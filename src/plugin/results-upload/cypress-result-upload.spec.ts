import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { HasAddEvidenceToTestRunEndpoint } from "../../client/xray/xray-client-cloud";
import type { HasAddEvidenceEndpoint } from "../../client/xray/xray-client-server";
import type { GetTestRunResponseServer } from "../../models/xray/responses/graphql/get-test-runs";
import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";
import cypressResultUpload from "./cypress-result-upload";

void describe(relative(cwd(), __filename), () => {
    void describe(cypressResultUpload.uploadCypressResults.name, () => {
        void it("imports cypress xray json", async (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const importExecutionMultipartMock = context.mock.fn(() => Promise.resolve("CYP-123"));
            const result = await cypressResultUpload.uploadCypressResults({
                client: {
                    addEvidence() {
                        throw new Error("Mock called unexpectedly");
                    },
                    getTestRun() {
                        throw new Error("Mock called unexpectedly");
                    },
                    importExecutionMultipart: importExecutionMultipartMock,
                },
                logger: { message: messageMock },
                multipartInfo: {
                    fields: {
                        issuetype: { id: "10008" },
                        labels: ["a", "b"],
                        project: { key: "CYP" },
                        summary: "Brand new Test execution",
                    },
                },
                options: { plugin: { splitUpload: false } },
                xrayJson: {
                    info: { description: "Hello", summary: "Test Execution Summary" },
                    testExecutionKey: "CYP-123",
                    tests: [
                        { status: "PASSED" },
                        { status: "PASSED" },
                        { status: "PASSED" },
                        { status: "FAILED" },
                    ],
                },
            });
            assert.deepStrictEqual(result, { testExecutionIssueKey: "CYP-123" });
            assert.deepStrictEqual(messageMock.mock.calls, []);
            assert.deepStrictEqual(
                importExecutionMultipartMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        {
                            info: { description: "Hello", summary: "Test Execution Summary" },
                            testExecutionKey: "CYP-123",
                            tests: [
                                { status: "PASSED" },
                                { status: "PASSED" },
                                { status: "PASSED" },
                                { status: "FAILED" },
                            ],
                        },
                        {
                            fields: {
                                issuetype: { id: "10008" },
                                labels: ["a", "b"],
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                    ],
                ]
            );
        });

        void describe("splits evidence uploads into multiple requests", () => {
            void it("server", async (context) => {
                const messageMock = context.mock.fn<Logger["message"]>();
                const importExecutionMultipartMock = context.mock.fn(() =>
                    Promise.resolve("CYP-123")
                );
                const addEvidenceMock = context.mock.fn<HasAddEvidenceEndpoint["addEvidence"]>();
                const getTestRunMock = context.mock.fn(() =>
                    Promise.resolve({ id: "123456789" } as unknown as GetTestRunResponseServer)
                );
                const result = await cypressResultUpload.uploadCypressResults({
                    client: {
                        addEvidence: addEvidenceMock,
                        getTestRun: getTestRunMock,
                        importExecutionMultipart: importExecutionMultipartMock,
                    },
                    logger: { message: messageMock },
                    multipartInfo: {
                        fields: {
                            issuetype: { id: "10008" },
                            project: { key: "CYP" },
                            summary: "Brand new Test execution",
                        },
                    },
                    options: { plugin: { splitUpload: true } },
                    xrayJson: {
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
                    },
                });
                assert.deepStrictEqual(result, { testExecutionIssueKey: "CYP-123" });
                assert.deepStrictEqual(messageMock.mock.calls, []);
                assert.deepStrictEqual(
                    importExecutionMultipartMock.mock.calls.map((call) => call.arguments),
                    [
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
                    ]
                );
                assert.deepStrictEqual(
                    getTestRunMock.mock.calls.map((call) => call.arguments),
                    [[{ testExecIssueKey: "CYP-123", testIssueKey: "CYP-456" }]]
                );
                assert.deepStrictEqual(
                    addEvidenceMock.mock.calls.map((call) => call.arguments),
                    [
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
                    ]
                );
            });

            void it("cloud", async (context) => {
                const messageMock = context.mock.fn<Logger["message"]>();
                const importExecutionMultipartMock = context.mock.fn(() =>
                    Promise.resolve("CYP-123")
                );
                const addEvidenceToTestRunMock = context.mock.fn(() =>
                    Promise.resolve({ addedEvidence: [], warnings: [] })
                );
                const getTestRunResultsMock = context.mock.fn(() =>
                    Promise.resolve([{ id: "123456789" }])
                );
                const result = await cypressResultUpload.uploadCypressResults({
                    client: {
                        addEvidenceToTestRun: addEvidenceToTestRunMock,
                        getTestRunResults: getTestRunResultsMock,
                        importExecutionMultipart: importExecutionMultipartMock,
                    },
                    logger: { message: messageMock },
                    multipartInfo: {
                        fields: {
                            issuetype: { id: "10008" },
                            project: { key: "CYP" },
                            summary: "Brand new Test execution",
                        },
                    },
                    options: { plugin: { splitUpload: true } },
                    xrayJson: {
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
                    },
                });
                assert.deepStrictEqual(result, { testExecutionIssueKey: "CYP-123" });
                assert.deepStrictEqual(messageMock.mock.calls, []);
                assert.deepStrictEqual(
                    importExecutionMultipartMock.mock.calls.map((call) => call.arguments),
                    [
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
                    ]
                );
                assert.deepStrictEqual(
                    getTestRunResultsMock.mock.calls.map((call) => call.arguments),
                    [[{ testExecIssueIds: ["CYP-123"], testIssueIds: ["CYP-456"] }]]
                );
                assert.deepStrictEqual(
                    addEvidenceToTestRunMock.mock.calls.map((call) => call.arguments),
                    [
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
                    ]
                );
            });
        });

        void describe("splits evidence uploads into multiple sequential requests", () => {
            void it("server", async (context) => {
                const messageMock = context.mock.fn<Logger["message"]>();
                const importExecutionMultipartMock = context.mock.fn(() =>
                    Promise.resolve("CYP-123")
                );
                const addEvidenceMock = context.mock.fn<HasAddEvidenceEndpoint["addEvidence"]>();
                const getTestRunMock = context.mock.fn(() =>
                    Promise.resolve({ id: "123456789" } as unknown as GetTestRunResponseServer)
                );
                const result = await cypressResultUpload.uploadCypressResults({
                    client: {
                        addEvidence: addEvidenceMock,
                        getTestRun: getTestRunMock,
                        importExecutionMultipart: importExecutionMultipartMock,
                    },
                    logger: { message: messageMock },
                    multipartInfo: {
                        fields: {
                            issuetype: { id: "10008" },
                            project: { key: "CYP" },
                            summary: "Brand new Test execution",
                        },
                    },
                    options: { plugin: { splitUpload: "sequential" } },
                    xrayJson: {
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
                    },
                });
                assert.deepStrictEqual(result, { testExecutionIssueKey: "CYP-123" });
                assert.deepStrictEqual(messageMock.mock.calls, []);
                assert.deepStrictEqual(
                    importExecutionMultipartMock.mock.calls.map((call) => call.arguments),
                    [
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
                    ]
                );
                assert.deepStrictEqual(
                    getTestRunMock.mock.calls.map((call) => call.arguments),
                    [[{ testExecIssueKey: "CYP-123", testIssueKey: "CYP-456" }]]
                );
                assert.deepStrictEqual(
                    addEvidenceMock.mock.calls.map((call) => call.arguments),
                    [
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
                    ]
                );
            });

            void it("cloud", async (context) => {
                const messageMock = context.mock.fn<Logger["message"]>();
                const importExecutionMultipartMock = context.mock.fn(() =>
                    Promise.resolve("CYP-123")
                );
                const addEvidenceToTestRunMock = context.mock.fn(() =>
                    Promise.resolve({ addedEvidence: [], warnings: [] })
                );
                const getTestRunResultsMock = context.mock.fn(() =>
                    Promise.resolve([{ id: "123456789" }])
                );
                const result = await cypressResultUpload.uploadCypressResults({
                    client: {
                        addEvidenceToTestRun: addEvidenceToTestRunMock,
                        getTestRunResults: getTestRunResultsMock,
                        importExecutionMultipart: importExecutionMultipartMock,
                    },
                    logger: { message: messageMock },
                    multipartInfo: {
                        fields: {
                            issuetype: { id: "10008" },
                            project: { key: "CYP" },
                            summary: "Brand new Test execution",
                        },
                    },
                    options: { plugin: { splitUpload: "sequential" } },
                    xrayJson: {
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
                    },
                });
                assert.deepStrictEqual(result, { testExecutionIssueKey: "CYP-123" });
                assert.deepStrictEqual(messageMock.mock.calls, []);
                assert.deepStrictEqual(
                    importExecutionMultipartMock.mock.calls.map((call) => call.arguments),
                    [
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
                    ]
                );
                assert.deepStrictEqual(
                    getTestRunResultsMock.mock.calls.map((call) => call.arguments),
                    [[{ testExecIssueIds: ["CYP-123"], testIssueIds: ["CYP-456"] }]]
                );
                assert.deepStrictEqual(
                    addEvidenceToTestRunMock.mock.calls.map((call) => call.arguments),
                    [
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
                    ]
                );
            });
        });

        void describe("handles evidence upload errors", () => {
            void describe("server", () => {
                void it("add evidence fails", async (context) => {
                    const messageMock = context.mock.fn<Logger["message"]>();
                    const importExecutionMultipartMock = context.mock.fn(() =>
                        Promise.resolve("CYP-123")
                    );
                    const addEvidenceMock = context.mock.fn<HasAddEvidenceEndpoint["addEvidence"]>(
                        (testRunId) =>
                            Promise.reject(
                                new Error(
                                    `Failed to upload evidence to test run: ${testRunId.toString()}`
                                )
                            )
                    );
                    const getTestRunMock = context.mock.fn(() =>
                        Promise.resolve({ id: "123456789" } as unknown as GetTestRunResponseServer)
                    );
                    await cypressResultUpload.uploadCypressResults({
                        client: {
                            addEvidence: addEvidenceMock,
                            getTestRun: getTestRunMock,
                            importExecutionMultipart: importExecutionMultipartMock,
                        },
                        logger: { message: messageMock },
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                        options: { plugin: { splitUpload: true } },
                        xrayJson: {
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
                        },
                    });
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidence first.txt of test CYP-456 to test execution CYP-123:

                                      Failed to upload evidence to test run: 123456789
                                `),
                            ],
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidence second.txt of test CYP-456 to test execution CYP-123:

                                      Failed to upload evidence to test run: 123456789
                                `),
                            ],
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidence third.txt of test CYP-456 to test execution CYP-123:

                                      Failed to upload evidence to test run: 123456789
                                `),
                            ],
                        ]
                    );
                });

                void it("get test run fails", async (context) => {
                    const messageMock = context.mock.fn<Logger["message"]>();
                    const importExecutionMultipartMock = context.mock.fn(() =>
                        Promise.resolve("CYP-123")
                    );
                    const addEvidenceMock = context.mock.fn(() => Promise.resolve());
                    const getTestRunMock = context.mock.fn(() =>
                        Promise.reject(new Error("Failed to get test run"))
                    );
                    await cypressResultUpload.uploadCypressResults({
                        client: {
                            addEvidence: addEvidenceMock,
                            getTestRun: getTestRunMock,
                            importExecutionMultipart: importExecutionMultipartMock,
                        },
                        logger: { message: messageMock },
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                        options: { plugin: { splitUpload: true } },
                        xrayJson: {
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
                                    ],
                                    status: "PASSED",
                                    testKey: "CYP-456",
                                },
                            ],
                        },
                    });
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidences of test CYP-456 to test execution CYP-123:

                                      Failed to get test run
                                `),
                            ],
                        ]
                    );
                });
            });

            void describe("cloud", () => {
                void it("add evidence fails", async (context) => {
                    const messageMock = context.mock.fn<Logger["message"]>();
                    const importExecutionMultipartMock = context.mock.fn(() =>
                        Promise.resolve("CYP-123")
                    );
                    const addEvidenceToTestRunMock = context.mock.fn<
                        HasAddEvidenceToTestRunEndpoint["addEvidenceToTestRun"]
                    >(({ id }) =>
                        Promise.reject(new Error(`Failed to upload evidence to test run: ${id}`))
                    );
                    const getTestRunResultsMock = context.mock.fn(() =>
                        Promise.resolve([{ id: "123456789" }])
                    );
                    await cypressResultUpload.uploadCypressResults({
                        client: {
                            addEvidenceToTestRun: addEvidenceToTestRunMock,
                            getTestRunResults: getTestRunResultsMock,
                            importExecutionMultipart: importExecutionMultipartMock,
                        },
                        logger: { message: messageMock },
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                        options: { plugin: { splitUpload: true } },
                        xrayJson: {
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
                        },
                    });
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidence first.txt of test CYP-456 to test execution CYP-123:

                                      Failed to upload evidence to test run: 123456789
                                `),
                            ],
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidence second.txt of test CYP-456 to test execution CYP-123:

                                      Failed to upload evidence to test run: 123456789
                                `),
                            ],
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidence third.txt of test CYP-456 to test execution CYP-123:

                                      Failed to upload evidence to test run: 123456789
                                `),
                            ],
                        ]
                    );
                });

                void it("add evidence returns warnings", async (context) => {
                    const messageMock = context.mock.fn<Logger["message"]>();
                    const importExecutionMultipartMock = context.mock.fn(() =>
                        Promise.resolve("CYP-123")
                    );
                    const addEvidenceToTestRunMock = context.mock.fn<
                        HasAddEvidenceToTestRunEndpoint["addEvidenceToTestRun"]
                    >(() =>
                        Promise.resolve({
                            addedEvidence: [],
                            warnings: ["oh no", "remaining storage space almost exceeded"],
                        })
                    );
                    const getTestRunResultsMock = context.mock.fn(() =>
                        Promise.resolve([{ id: "123456789" }])
                    );
                    await cypressResultUpload.uploadCypressResults({
                        client: {
                            addEvidenceToTestRun: addEvidenceToTestRunMock,
                            getTestRunResults: getTestRunResultsMock,
                            importExecutionMultipart: importExecutionMultipartMock,
                        },
                        logger: { message: messageMock },
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                        options: { plugin: { splitUpload: "sequential" } },
                        xrayJson: {
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
                                    ],
                                    status: "PASSED",
                                    testKey: "CYP-456",
                                },
                            ],
                        },
                    });
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                "warning",
                                dedent(`
                                    Xray warning occurred during upload of evidence first.txt of test CYP-456 to test execution CYP-123:

                                      oh no
                                `),
                            ],
                            [
                                "warning",
                                dedent(`
                                    Xray warning occurred during upload of evidence first.txt of test CYP-456 to test execution CYP-123:

                                      remaining storage space almost exceeded
                                `),
                            ],
                        ]
                    );
                });

                void it("get test run fails", async (context) => {
                    const messageMock = context.mock.fn<Logger["message"]>();
                    const importExecutionMultipartMock = context.mock.fn(() =>
                        Promise.resolve("CYP-123")
                    );
                    const addEvidenceToTestRunMock = context.mock.fn<
                        HasAddEvidenceToTestRunEndpoint["addEvidenceToTestRun"]
                    >(() => Promise.resolve({ addedEvidence: [], warnings: [] }));
                    const getTestRunResultsMock = context.mock.fn(() =>
                        Promise.reject(new Error("Failed to get test run results"))
                    );
                    await cypressResultUpload.uploadCypressResults({
                        client: {
                            addEvidenceToTestRun: addEvidenceToTestRunMock,
                            getTestRunResults: getTestRunResultsMock,
                            importExecutionMultipart: importExecutionMultipartMock,
                        },
                        logger: { message: messageMock },
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                        options: { plugin: { splitUpload: true } },
                        xrayJson: {
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
                                    ],
                                    status: "PASSED",
                                    testKey: "CYP-456",
                                },
                            ],
                        },
                    });
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidences of test CYP-456 to test execution CYP-123:

                                      Failed to get test run results
                                `),
                            ],
                        ]
                    );
                });

                void it("no test run is returned", async (context) => {
                    const messageMock = context.mock.fn<Logger["message"]>();
                    const importExecutionMultipartMock = context.mock.fn(() =>
                        Promise.resolve("CYP-123")
                    );
                    const addEvidenceToTestRunMock = context.mock.fn<
                        HasAddEvidenceToTestRunEndpoint["addEvidenceToTestRun"]
                    >(() => Promise.resolve({ addedEvidence: [], warnings: [] }));
                    const getTestRunResultsMock = context.mock.fn(() => Promise.resolve([]));
                    await cypressResultUpload.uploadCypressResults({
                        client: {
                            addEvidenceToTestRun: addEvidenceToTestRunMock,
                            getTestRunResults: getTestRunResultsMock,
                            importExecutionMultipart: importExecutionMultipartMock,
                        },
                        logger: { message: messageMock },
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                        options: { plugin: { splitUpload: true } },
                        xrayJson: {
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
                                    ],
                                    status: "PASSED",
                                    testKey: "CYP-456",
                                },
                            ],
                        },
                    });
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidences of test CYP-456 to test execution CYP-123:

                                      Zero test runs were found for test execution CYP-123 and test CYP-456
                                `),
                            ],
                        ]
                    );
                });

                void it("multiple test runs are returned", async (context) => {
                    const messageMock = context.mock.fn<Logger["message"]>();
                    const importExecutionMultipartMock = context.mock.fn(() =>
                        Promise.resolve("CYP-123")
                    );
                    const addEvidenceToTestRunMock = context.mock.fn<
                        HasAddEvidenceToTestRunEndpoint["addEvidenceToTestRun"]
                    >(() => Promise.resolve({ addedEvidence: [], warnings: [] }));
                    const getTestRunResultsMock = context.mock.fn(() =>
                        Promise.resolve([{ id: "123" }, { id: "456" }])
                    );
                    await cypressResultUpload.uploadCypressResults({
                        client: {
                            addEvidenceToTestRun: addEvidenceToTestRunMock,
                            getTestRunResults: getTestRunResultsMock,
                            importExecutionMultipart: importExecutionMultipartMock,
                        },
                        logger: { message: messageMock },
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                        options: { plugin: { splitUpload: true } },
                        xrayJson: {
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
                                    ],
                                    status: "PASSED",
                                    testKey: "CYP-456",
                                },
                            ],
                        },
                    });
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidences of test CYP-456 to test execution CYP-123:

                                      Multiple test runs were found for test execution CYP-123 and test CYP-456:

                                        {
                                          "id": "123"
                                        }

                                        {
                                          "id": "456"
                                        }
                                `),
                            ],
                        ]
                    );
                });

                void it("a test run without id is returned", async (context) => {
                    const messageMock = context.mock.fn<Logger["message"]>();
                    const importExecutionMultipartMock = context.mock.fn(() =>
                        Promise.resolve("CYP-123")
                    );
                    const addEvidenceToTestRunMock = context.mock.fn<
                        HasAddEvidenceToTestRunEndpoint["addEvidenceToTestRun"]
                    >(() => Promise.resolve({ addedEvidence: [], warnings: [] }));
                    const getTestRunResultsMock = context.mock.fn(() =>
                        Promise.resolve([{ comment: "This test run is beautiful" }])
                    );
                    await cypressResultUpload.uploadCypressResults({
                        client: {
                            addEvidenceToTestRun: addEvidenceToTestRunMock,
                            getTestRunResults: getTestRunResultsMock,
                            importExecutionMultipart: importExecutionMultipartMock,
                        },
                        logger: { message: messageMock },
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                        options: { plugin: { splitUpload: true } },
                        xrayJson: {
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
                                    ],
                                    status: "PASSED",
                                    testKey: "CYP-456",
                                },
                            ],
                        },
                    });
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                "warning",
                                dedent(`
                                    Failed to attach evidences of test CYP-456 to test execution CYP-123:

                                      Test run without ID found for test execution CYP-123 and test CYP-456:

                                        {
                                          "comment": "This test run is beautiful"
                                        }
                                `),
                            ],
                        ]
                    );
                });
            });
        });
    });
});
