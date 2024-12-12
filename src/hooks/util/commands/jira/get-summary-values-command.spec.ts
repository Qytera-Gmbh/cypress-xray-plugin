import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { PatCredentials } from "../../../../client/authentication/credentials";
import { AxiosRestClient } from "../../../../client/https/requests";
import type { JiraClient } from "../../../../client/jira/jira-client";
import { BaseJiraClient } from "../../../../client/jira/jira-client";
import { dedent } from "../../../../util/dedent";
import { Level, LOG } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { GetSummaryValuesCommand } from "./get-summary-values-command";

describe(relative(cwd(), __filename), async () => {
    await describe(GetSummaryValuesCommand.name, async () => {
        await it("fetches summaries", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                jiraClient,
                "search",
                context.mock.fn<JiraClient["search"]>(async (request) => {
                    if (
                        request.fields &&
                        request.fields[0] === "summary" &&
                        request.jql === "issue in (CYP-123,CYP-456,CYP-789)"
                    ) {
                        return await Promise.resolve([
                            { fields: { ["summary"]: "Hello" }, key: "CYP-123" },
                            { fields: { ["summary"]: "Good Morning" }, key: "CYP-456" },
                            { fields: { ["summary"]: "Goodbye" }, key: "CYP-789" },
                        ]);
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new GetSummaryValuesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-456", "CYP-789"])
            );
            const summaries = await command.compute();
            assert.deepStrictEqual(summaries, {
                ["CYP-123"]: "Hello",
                ["CYP-456"]: "Good Morning",
                ["CYP-789"]: "Goodbye",
            });
        });

        await it("displays a warning for issues which do not exist", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                jiraClient,
                "search",
                context.mock.fn<JiraClient["search"]>(async (request) => {
                    if (
                        request.fields &&
                        request.fields[0] === "summary" &&
                        request.jql === "issue in (CYP-123,CYP-789,CYP-456)"
                    ) {
                        return await Promise.resolve([
                            { fields: { ["summary"]: "Hello" }, key: "CYP-123" },
                        ]);
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new GetSummaryValuesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-789", "CYP-456"])
            );
            assert.deepStrictEqual(await command.compute(), {
                ["CYP-123"]: "Hello",
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.WARNING,
                dedent(`
                    Failed to find Jira issues:

                      CYP-456
                      CYP-789
                `),
            ]);
        });

        await it("displays a warning for issues whose fields cannot be parsed", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                jiraClient,
                "search",
                context.mock.fn<JiraClient["search"]>(async (request) => {
                    if (
                        request.fields &&
                        request.fields[0] === "summary" &&
                        request.jql === "issue in (CYP-123,CYP-789,CYP-456)"
                    ) {
                        return await Promise.resolve([
                            { fields: { ["summary"]: { an: "object" } }, key: "CYP-123" },
                            {
                                fields: { bonjour: ["Where", "did", "I", "come", "from?"] },
                                key: "CYP-456",
                            },
                            { fields: { ["summary"]: [42, 84] }, key: "CYP-789" },
                            { fields: { ["summary"]: "hi" } },
                        ]);
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new GetSummaryValuesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-789", "CYP-456"])
            );
            assert.deepStrictEqual(await command.compute(), {});
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.WARNING,
                dedent(`
                    Failed to parse Jira field with ID summary in issues:

                      CYP-123: Value is not of type string: {"an":"object"}
                      CYP-456: Expected an object containing property 'summary', but got: {"bonjour":["Where","did","I","come","from?"]}
                      CYP-789: Value is not of type string: [42,84]
                      Unknown: {"fields":{"summary":"hi"}}
                `),
            ]);
        });

        await it("throws when encountering search failures", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                jiraClient,
                "search",
                context.mock.fn<JiraClient["search"]>(async () => {
                    return await Promise.reject(new Error("Connection timeout"));
                })
            );
            const command = new GetSummaryValuesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-789", "CYP-456"])
            );
            await assert.rejects(command.compute(), { message: "Connection timeout" });
        });
    });
});
