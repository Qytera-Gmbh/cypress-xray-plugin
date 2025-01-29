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
import { LOG } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { GetLabelValuesCommand } from "./get-label-values-command";

describe(relative(cwd(), __filename), async () => {
    await describe(GetLabelValuesCommand.name, async () => {
        await it("fetches labels", async (context) => {
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
                        request.fields[0] === "labels" &&
                        request.jql === "issue in (CYP-123,CYP-456,CYP-789)"
                    ) {
                        return await Promise.resolve([
                            { fields: { labels: ["label", "two labels"] }, key: "CYP-123" },
                            { fields: { labels: ["three labels"] }, key: "CYP-456" },
                            { fields: { labels: [] }, key: "CYP-789" },
                        ]);
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new GetLabelValuesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-456", "CYP-789"])
            );
            const summaries = await command.compute();
            assert.deepStrictEqual(summaries, {
                ["CYP-123"]: ["label", "two labels"],
                ["CYP-456"]: ["three labels"],
                ["CYP-789"]: [],
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
                        request.fields[0] === "labels" &&
                        request.jql === "issue in (CYP-123,CYP-789,CYP-456)"
                    ) {
                        return await Promise.resolve([
                            { fields: { labels: ["label"] }, key: "CYP-123" },
                        ]);
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new GetLabelValuesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-789", "CYP-456"])
            );
            assert.deepStrictEqual(await command.compute(), {
                ["CYP-123"]: ["label"],
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
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
                        request.fields[0] === "labels" &&
                        request.jql === "issue in (CYP-123,CYP-789,CYP-456)"
                    ) {
                        return await Promise.resolve([
                            { fields: { labels: "string" }, key: "CYP-123" },
                            { fields: { bonjour: 42 }, key: "CYP-456" },
                            { fields: { labels: [42, 84] }, key: "CYP-789" },
                            { fields: { labels: ["hi", "there"] } },
                        ]);
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new GetLabelValuesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-789", "CYP-456"])
            );
            assert.deepStrictEqual(await command.compute(), {});
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    Failed to parse Jira field with ID labels in issues:

                      CYP-123: Value is not an array of type string: "string"
                      CYP-456: Expected an object containing property 'labels', but got: {"bonjour":42}
                      CYP-789: Value is not an array of type string: [42,84]
                      Unknown: {"fields":{"labels":["hi","there"]}}
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
                context.mock.fn<JiraClient["search"]>(async (request) => {
                    if (
                        request.fields &&
                        request.fields[0] === "labels" &&
                        request.jql === "issue in (CYP-123,CYP-789,CYP-456)"
                    ) {
                        await Promise.reject(new Error("Connection timeout"));
                    }
                    throw new Error("Mock called unexpectedly");
                })
            );
            const command = new GetLabelValuesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-789", "CYP-456"])
            );
            await assert.rejects(command.compute(), { message: "Connection timeout" });
        });
    });
});
