import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { PatCredentials } from "../../../../client/authentication/credentials";
import { AxiosRestClient } from "../../../../client/https/https";
import type { JiraClient } from "../../../../client/jira/jira-client";
import { BaseJiraClient } from "../../../../client/jira/jira-client";
import { dedent } from "../../../../util/dedent";
import { Level, LOG } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { EditIssueFieldCommand } from "./edit-issue-field-command";

describe(relative(cwd(), __filename), async () => {
    await describe(EditIssueFieldCommand.name, async () => {
        await it("edits issues", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                jiraClient,
                "editIssue",
                context.mock.fn<JiraClient["editIssue"]>((issueIdOrKey, issueUpdateData) => {
                    if (
                        issueIdOrKey === "CYP-123" &&
                        issueUpdateData.fields &&
                        issueUpdateData.fields.customfield_12345 === "hello"
                    ) {
                        return Promise.resolve("CYP-123");
                    }
                    if (
                        issueIdOrKey === "CYP-456" &&
                        issueUpdateData.fields &&
                        issueUpdateData.fields.customfield_12345 === "there"
                    ) {
                        return Promise.resolve("CYP-456");
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new EditIssueFieldCommand(
                {
                    fieldId: "summary",
                    jiraClient: jiraClient,
                },
                LOG,
                new ConstantCommand(LOG, "customfield_12345"),
                new ConstantCommand(LOG, {
                    ["CYP-123"]: "hello",
                    ["CYP-456"]: "there",
                })
            );
            assert.deepStrictEqual(await command.compute(), ["CYP-123", "CYP-456"]);
            assert.strictEqual(message.mock.callCount(), 0);
        });

        await it("logs errors for unsuccessful edits", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                jiraClient,
                "editIssue",
                context.mock.fn<JiraClient["editIssue"]>((issueIdOrKey, issueUpdateData) => {
                    if (
                        issueIdOrKey === "CYP-123" &&
                        issueUpdateData.fields &&
                        (issueUpdateData.fields.customfield_12345 as string[])[0] === "dev" &&
                        (issueUpdateData.fields.customfield_12345 as string[])[1] === "test"
                    ) {
                        return Promise.resolve("CYP-123");
                    }
                    if (
                        issueIdOrKey === "CYP-123" &&
                        issueUpdateData.fields &&
                        (issueUpdateData.fields.customfield_12345 as string[])[0] === "test"
                    ) {
                        new Error("No editing allowed");
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new EditIssueFieldCommand(
                {
                    fieldId: "labels",
                    jiraClient: jiraClient,
                },
                LOG,
                new ConstantCommand(LOG, "customfield_12345"),
                new ConstantCommand(LOG, {
                    ["CYP-123"]: ["dev", "test"],
                    ["CYP-456"]: ["test"],
                })
            );
            assert.deepStrictEqual(await command.compute(), ["CYP-123"]);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.WARNING,
                dedent(`
                    CYP-456

                      Failed to set labels field to value: ["test"]
                `),
            ]);
        });

        await it("returns empty arrays", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                jiraClient,
                "addAttachment",
                context.mock.fn<JiraClient["addAttachment"]>((issueIdOrKey, ...files) => {
                    if (
                        issueIdOrKey === "CYP-123" &&
                        files[0] === "image.jpg" &&
                        files[1] === "something.mp4"
                    ) {
                        return Promise.resolve([
                            { filename: "image.jpg", size: 12345 },
                            { filename: "something.mp4", size: 54321 },
                        ]);
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new EditIssueFieldCommand(
                {
                    fieldId: "labels",
                    jiraClient: jiraClient,
                },
                LOG,
                new ConstantCommand(LOG, "customfield_12345"),
                new ConstantCommand(LOG, {})
            );
            assert.deepStrictEqual(await command.compute(), []);
            assert.strictEqual(message.mock.callCount(), 0);
        });
    });
});
