import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { PatCredentials } from "../../../../client/authentication/credentials.js";
import { AxiosRestClient } from "../../../../client/https/https.js";
import type { JiraClient } from "../../../../client/jira/jira-client.js";
import { BaseJiraClient } from "../../../../client/jira/jira-client.js";
import { Level, LOG } from "../../../../util/logging.js";
import { ConstantCommand } from "../constant-command.js";
import { TransitionIssueCommand } from "./transition-issue-command.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(TransitionIssueCommand.name, async () => {
        await it("transitions issues", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            const transitionIssue = context.mock.method(
                jiraClient,
                "transitionIssue",
                context.mock.fn<JiraClient["transitionIssue"]>()
            );
            const command = new TransitionIssueCommand(
                { jiraClient: jiraClient, transition: { id: "5" } },
                LOG,
                new ConstantCommand(LOG, "CYP-123")
            );
            await command.compute();
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.INFO,
                "Transitioning test execution issue CYP-123",
            ]);
            assert.deepStrictEqual(transitionIssue.mock.calls[0].arguments, [
                "CYP-123",
                {
                    transition: {
                        id: "5",
                    },
                },
            ]);
        });
    });
});
