import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { HasEditIssueEndpoint, HasSearchEndpoint } from "../../client/jira/jira-client";
import type { Issue } from "../../models/jira/responses/issue";
import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";
import jiraIssueSnapshots from "./jira-issue-snapshots";

void describe(relative(cwd(), __filename), () => {
    void describe(jiraIssueSnapshots.getIssueSnapshots.name, () => {
        void it("returns no snapshot data if no issues are specified", async (context) => {
            const searchMock = context.mock.fn<HasSearchEndpoint["search"]>();
            searchMock.mock.mockImplementationOnce(() => Promise.resolve([]));
            const result = await jiraIssueSnapshots.getIssueSnapshots({
                client: { search: searchMock },
                issues: [],
            });
            assert.deepStrictEqual(result, {
                errorMessages: [],
                issues: [],
            });
        });

        void it("returns the input data for inputs with everything known already", async (context) => {
            const searchMock = context.mock.fn<HasSearchEndpoint["search"]>();
            const result = await jiraIssueSnapshots.getIssueSnapshots({
                client: { search: searchMock },
                issues: [
                    { key: "CYP-123", labels: ["a", "b"], summary: "My first issue" },
                    { key: "CYP-456", labels: ["c"], summary: "My second issue" },
                    { key: "CYP-789", labels: [], summary: "My third issue" },
                ],
            });
            assert.deepStrictEqual(result, {
                errorMessages: [],
                issues: [
                    { key: "CYP-123", labels: ["a", "b"], summary: "My first issue" },
                    { key: "CYP-456", labels: ["c"], summary: "My second issue" },
                    { key: "CYP-789", labels: [], summary: "My third issue" },
                ],
            });
            assert.deepStrictEqual(
                searchMock.mock.calls.map((call) => call.arguments),
                []
            );
        });

        void it("snapshots only issues with unknown and partially known data", async (context) => {
            const searchMock = context.mock.fn<HasSearchEndpoint["search"]>();
            searchMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    { fields: { labels: ["c"], summary: "My second issue" }, key: "CYP-34" },
                    { fields: { labels: [], summary: "My third issue" }, key: "CYP-56" },
                    { fields: { labels: ["x"], summary: "My fourth issue" }, key: "CYP-78" },
                ] satisfies Issue[])
            );
            const result = await jiraIssueSnapshots.getIssueSnapshots({
                client: { search: searchMock },
                issues: [
                    { key: "CYP-12", labels: ["a", "b"], summary: "My first issue" },
                    { key: "CYP-34", labels: ["c"] },
                    { key: "CYP-56", summary: "My third issue" },
                    { key: "CYP-78" },
                ],
            });
            assert.deepStrictEqual(result, {
                errorMessages: [],
                issues: [
                    { key: "CYP-12", labels: ["a", "b"], summary: "My first issue" },
                    { key: "CYP-34", labels: ["c"], summary: "My second issue" },
                    { key: "CYP-56", labels: [], summary: "My third issue" },
                    { key: "CYP-78", labels: ["x"], summary: "My fourth issue" },
                ],
            });
            assert.deepStrictEqual(
                searchMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        {
                            fields: ["summary", "labels"],
                            jql: `issue in (CYP-34,CYP-56,CYP-78)`,
                        },
                    ],
                ]
            );
        });

        void it("returns error messages for issues without issue key", async (context) => {
            const searchMock = context.mock.fn<HasSearchEndpoint["search"]>();
            searchMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    { fields: { labels: ["a", "b"], summary: "My first issue" }, key: "CYP-123" },
                    { fields: { labels: ["c"], summary: "My second issue" } },
                ] satisfies Issue[])
            );
            const result = await jiraIssueSnapshots.getIssueSnapshots({
                client: { search: searchMock },
                issues: [{ key: "CYP-123" }, { key: "CYP-456" }],
            });
            assert.deepStrictEqual(result, {
                errorMessages: [
                    'Jira returned an unknown issue: {"fields":{"labels":["c"],"summary":"My second issue"}}',
                ],
                issues: [{ key: "CYP-123", labels: ["a", "b"], summary: "My first issue" }],
            });
        });

        void it("returns error messages for issues with missing or unknown summary fields", async (context) => {
            const searchMock = context.mock.fn<HasSearchEndpoint["search"]>();
            searchMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    { fields: { labels: [] }, key: "CYP-123" },
                    { fields: { labels: [], summary: ["A broken summary"] }, key: "CYP-456" },
                    { fields: { labels: ["xyz"], summary: "A good summary" }, key: "CYP-789" },
                ] satisfies Issue[])
            );
            const result = await jiraIssueSnapshots.getIssueSnapshots({
                client: { search: searchMock },
                issues: [{ key: "CYP-123" }, { key: "CYP-456" }, { key: "CYP-789" }],
            });
            assert.deepStrictEqual(result, {
                errorMessages: [
                    `CYP-123: Expected an object containing property 'summary', but got: {"labels":[]}`,
                    'CYP-456: Value is not of type string: ["A broken summary"]',
                ],
                issues: [{ key: "CYP-789", labels: ["xyz"], summary: "A good summary" }],
            });
        });

        void it("returns error messages for issues with missing or unknown label fields", async (context) => {
            const searchMock = context.mock.fn<HasSearchEndpoint["search"]>();
            searchMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    { fields: { labels: [], summary: "My first issue" }, key: "CYP-123" },
                    { fields: { labels: "abc", summary: "My second issue" }, key: "CYP-456" },
                    { fields: { summary: "My third issue" }, key: "CYP-789" },
                ] satisfies Issue[])
            );
            const result = await jiraIssueSnapshots.getIssueSnapshots({
                client: { search: searchMock },
                issues: [{ key: "CYP-123" }, { key: "CYP-456" }, { key: "CYP-789" }],
            });
            assert.deepStrictEqual(result, {
                errorMessages: [
                    'CYP-456: Value is not an array of type string: "abc"',
                    `CYP-789: Expected an object containing property 'labels', but got: {"summary":"My third issue"}`,
                ],
                issues: [{ key: "CYP-123", labels: [], summary: "My first issue" }],
            });
        });
    });

    void describe(jiraIssueSnapshots.restoreIssueSnapshots.name, () => {
        void it("handles unrecoverable issues", async (context) => {
            const editIssueMock = context.mock.fn<HasEditIssueEndpoint["editIssue"]>();
            const messageMock = context.mock.fn<Logger["message"]>();
            await jiraIssueSnapshots.restoreIssueSnapshots({
                client: { editIssue: editIssueMock },
                logger: { message: messageMock },
                newData: [
                    { key: "CYP-123", labels: [], summary: "My first issue" },
                    { key: "CYP-456", labels: ["a"], summary: "My second issue" },
                    { key: "CYP-789", labels: ["b"], summary: "My third issue" },
                ],
                previousData: [],
            });
            assert.deepStrictEqual(editIssueMock.mock.calls, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            CYP-123

                              The plugin tried to reset the issue data after importing the feature files, but could not because the no backup data could be retrieved.

                              Make sure to manually restore it if needed.
                        `),
                    ],
                    [
                        "warning",
                        dedent(`
                            CYP-456

                              The plugin tried to reset the issue data after importing the feature files, but could not because the no backup data could be retrieved.

                              Make sure to manually restore it if needed.
                        `),
                    ],
                    [
                        "warning",
                        dedent(`
                            CYP-789

                              The plugin tried to reset the issue data after importing the feature files, but could not because the no backup data could be retrieved.

                              Make sure to manually restore it if needed.
                        `),
                    ],
                ]
            );
        });

        void it("restores issues with changed data", async (context) => {
            const editIssueMock = context.mock.fn<HasEditIssueEndpoint["editIssue"]>();
            const messageMock = context.mock.fn<Logger["message"]>();
            await jiraIssueSnapshots.restoreIssueSnapshots({
                client: { editIssue: editIssueMock },
                logger: { message: messageMock },
                newData: [
                    { key: "CYP-123", labels: ["a"], summary: "My first issue" },
                    { key: "CYP-456", labels: ["a", "x"], summary: "My second issue" },
                    { key: "CYP-789", labels: [], summary: "My changed third issue" },
                ],
                previousData: [
                    { key: "CYP-123", labels: ["a"], summary: "My first issue" },
                    { key: "CYP-456", labels: ["b"], summary: "My second issue" },
                    { key: "CYP-789", labels: ["c"], summary: "My third issue" },
                ],
            });
            assert.deepStrictEqual(
                editIssueMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "CYP-456",
                        {
                            fields: {
                                labels: ["b"],
                                summary: "My second issue",
                            },
                        },
                    ],
                    [
                        "CYP-789",
                        {
                            fields: {
                                labels: ["c"],
                                summary: "My third issue",
                            },
                        },
                    ],
                ]
            );
            assert.deepStrictEqual(messageMock.mock.calls, []);
        });

        void it("handles edit failures", async (context) => {
            const editIssueMock = context.mock.fn<HasEditIssueEndpoint["editIssue"]>();
            editIssueMock.mock.mockImplementationOnce(() =>
                Promise.reject(new Error("Insufficient permissions"))
            );
            const messageMock = context.mock.fn<Logger["message"]>();
            await jiraIssueSnapshots.restoreIssueSnapshots({
                client: { editIssue: editIssueMock },
                logger: { message: messageMock },
                newData: [
                    { key: "CYP-123", labels: ["a"], summary: "My first issue" },
                    { key: "CYP-456", labels: ["a", "x"], summary: "My second issue" },
                    { key: "CYP-789", labels: [], summary: "My changed third issue" },
                ],
                previousData: [
                    { key: "CYP-123", labels: ["a"], summary: "My first issue" },
                    { key: "CYP-456", labels: ["b"], summary: "My second issue" },
                    { key: "CYP-789", labels: ["c"], summary: "My third issue" },
                ],
            });
            assert.deepStrictEqual(
                editIssueMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "CYP-456",
                        {
                            fields: {
                                labels: ["b"],
                                summary: "My second issue",
                            },
                        },
                    ],
                    [
                        "CYP-789",
                        {
                            fields: {
                                labels: ["c"],
                                summary: "My third issue",
                            },
                        },
                    ],
                ]
            );
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            Failed to restore backed up Jira issue data for CYP-456:

                              Insufficient permissions
                        `),
                    ],
                ]
            );
        });
    });
});
