import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { HasGetFieldsEndpoint } from "../../client/jira/jira-client";
import { dedent } from "../../util/dedent";
import multipartInfoConversion from "./multipart-info-conversion";

void describe(relative(cwd(), __filename), () => {
    void describe(multipartInfoConversion.convertMultipartInfoCloud.name, () => {
        void it("returns cloud info data", () => {
            const result = multipartInfoConversion.convertMultipartInfoCloud({
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: { id: "issue_1578" },
                                summary: "Execution Results [1694257168829]",
                            },
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.multipartInfo, {
                fields: {
                    description: "Cypress version: 42.4.9\nBrowser: Firefox (123.11.6)",
                    issuetype: { id: "issue_1578" },
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1694257168829]",
                },
                historyMetadata: undefined,
                properties: undefined,
                transition: undefined,
                update: undefined,
                xrayFields: {
                    environments: undefined,
                    testPlanKey: undefined,
                },
            });
        });

        void it("includes configured test plan issue keys", () => {
            const result = multipartInfoConversion.convertMultipartInfoCloud({
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: { id: "issue_1578" },
                                summary: "Execution Results [1694257168829]",
                            },
                            testPlan: "CYP-123",
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.multipartInfo.xrayFields, {
                environments: undefined,
                testPlanKey: "CYP-123",
            });
        });

        void it("includes configured test environments", () => {
            const result = multipartInfoConversion.convertMultipartInfoCloud({
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: { id: "issue_1578" },
                                summary: "Execution Results [1694257168829]",
                            },
                            testEnvironments: ["DEV", "PROD"],
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.multipartInfo.xrayFields, {
                environments: ["DEV", "PROD"],
                testPlanKey: undefined,
            });
        });
    });

    void describe(multipartInfoConversion.convertMultipartInfoServer.name, () => {
        void it("returns server info data", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: { id: "issue_1578" },
                                summary: "my summary",
                            },
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.multipartInfo, {
                fields: {
                    description: "Cypress version: 42.4.9\nBrowser: Firefox (123.11.6)",
                    issuetype: { id: "issue_1578" },
                    project: {
                        key: "CYP",
                    },
                    summary: "my summary",
                },
                historyMetadata: undefined,
                properties: undefined,
                transition: undefined,
                update: undefined,
            });
            assert.deepStrictEqual(getFieldsMock.mock.calls, []);
        });

        void it("includes configured test plan issue keys without searching for field ids", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {
                            testPlan: "customfield_12345",
                        },
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: { id: "issue_1578" },
                                summary: "my summary",
                            },
                            testPlan: "CYP-123",
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.multipartInfo.fields.customfield_12345, ["CYP-123"]);
            assert.deepStrictEqual(getFieldsMock.mock.calls, []);
        });

        void it("includes configured test environments without searching for field ids", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {
                            testEnvironments: "customfield_45678",
                        },
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: {},
                                summary: "my summary",
                            },
                            testEnvironments: ["DEV", "PROD"],
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.multipartInfo.fields.customfield_45678, ["DEV", "PROD"]);
            assert.deepStrictEqual(getFieldsMock.mock.calls, []);
        });

        void it("includes configured test plans by searching for field ids", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            getFieldsMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    {
                        clauseNames: ["Test Plan"],
                        custom: false,
                        id: "customfield_45678",
                        name: "test plan",
                        navigable: false,
                        orderable: false,
                        schema: {},
                        searchable: false,
                    },
                ])
            );
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: {},
                                summary: "my summary",
                            },
                            testPlan: "CYP-123",
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.multipartInfo.fields.customfield_45678, ["CYP-123"]);
            assert.deepStrictEqual(
                getFieldsMock.mock.calls.map((call) => call.arguments),
                [[]]
            );
        });

        void it("includes configured test environments by searching for field ids", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            getFieldsMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    {
                        clauseNames: ["Test Environment"],
                        custom: false,
                        id: "customfield_12345",
                        name: "test environments",
                        navigable: false,
                        orderable: false,
                        schema: {},
                        searchable: false,
                    },
                ])
            );
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: {},
                                summary: "my summary",
                            },
                            testEnvironments: ["DEV", "RELEASE Q2"],
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.multipartInfo.fields.customfield_12345, [
                "DEV",
                "RELEASE Q2",
            ]);
            assert.deepStrictEqual(
                getFieldsMock.mock.calls.map((call) => call.arguments),
                [[]]
            );
        });

        void it("returns error messages for configured test plans if there are multiple fields with that name", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            getFieldsMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    {
                        clauseNames: ["Test Plan"],
                        custom: false,
                        id: "customfield_12345",
                        name: "test plan",
                        navigable: false,
                        orderable: false,
                        schema: {},
                        searchable: false,
                    },
                    {
                        clauseNames: ["Test Plan Copy"],
                        custom: false,
                        id: "customfield_67890",
                        name: "test plan",
                        navigable: false,
                        orderable: false,
                        schema: {},
                        searchable: false,
                    },
                ])
            );
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: {},
                                summary: "my summary",
                            },
                            testPlan: "ABC-123",
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.errorMessages, [
                dedent(`
                    Failed to fetch Jira field ID for field with name: test plan
                    There are multiple fields with this name

                    Duplicates:
                      clauseNames: ["Test Plan Copy"], custom: false, id: "customfield_67890", name: "test plan", navigable: false, orderable: false, schema: {}, searchable: false
                      clauseNames: ["Test Plan"]     , custom: false, id: "customfield_12345", name: "test plan", navigable: false, orderable: false, schema: {}, searchable: false

                    You can provide field IDs in the options:

                      jira: {
                        fields: {
                          testPlan: // "customfield_12345" or "customfield_67890"
                        }
                      }
                `),
            ]);
        });

        void it("returns error messages for configured test plans if the field does not exist", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            getFieldsMock.mock.mockImplementationOnce(() => Promise.resolve([]));
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: {},
                                summary: "my summary",
                            },
                            testPlan: "ABC-123",
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.errorMessages, [
                dedent(`
                    Failed to fetch Jira field ID for field with name: test plan
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          testPlan: // corresponding field ID
                        }
                      }
                `),
            ]);
        });

        void it("returns error messages for configured test environments if the field does not exist", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            getFieldsMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    {
                        clauseNames: ["Summary"],
                        custom: false,
                        id: "summary",
                        name: "summary",
                        navigable: false,
                        orderable: false,
                        schema: {},
                        searchable: false,
                    },
                    {
                        clauseNames: ["Description"],
                        custom: false,
                        id: "description",
                        name: "description",
                        navigable: false,
                        orderable: false,
                        schema: {},
                        searchable: false,
                    },
                ])
            );
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: {},
                                summary: "my summary",
                            },
                            testEnvironments: ["DEV", "RELEASE Q2"],
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.errorMessages, [
                dedent(`
                    Failed to fetch Jira field ID for field with name: test environments
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    Available fields:
                      name: "description" id: "description"
                      name: "summary"     id: "summary"

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          testEnvironments: // corresponding field ID
                        }
                      }
                `),
            ]);
        });

        void it("returns error messages for configured test plans if the fields call fails", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            getFieldsMock.mock.mockImplementationOnce(() =>
                Promise.reject(new Error("Failed to connect to Jira"))
            );
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: {},
                                summary: "my summary",
                            },
                            testPlan: "XYZ-456",
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.errorMessages, [
                dedent(`
                    Failed to fetch all Jira fields for test plan field ID extraction, the test execution issue may not be assigned to the desired test plan

                      Failed to connect to Jira
                `),
            ]);
        });

        void it("returns error messages for configured test environments if the fields call fails", async (context) => {
            const getFieldsMock = context.mock.fn<HasGetFieldsEndpoint["getFields"]>();
            getFieldsMock.mock.mockImplementationOnce(() =>
                Promise.reject(new Error("Failed to connect to Jira again"))
            );
            const result = await multipartInfoConversion.convertMultipartInfoServer({
                client: { getFields: getFieldsMock },
                cypress: {
                    config: {
                        browserName: "Firefox",
                        browserVersion: "123.11.6",
                        cypressVersion: "42.4.9",
                    },
                },
                options: {
                    jira: {
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssue: {
                            fields: {
                                issuetype: {},
                                summary: "my summary",
                            },
                            testEnvironments: ["a", "b"],
                        },
                    },
                },
            });
            assert.deepStrictEqual(result.errorMessages, [
                dedent(`
                    Failed to fetch all Jira fields for test environment field ID extraction, the test execution issue may not be assigned the desired test environments

                      Failed to connect to Jira again
                `),
            ]);
        });
    });
});
