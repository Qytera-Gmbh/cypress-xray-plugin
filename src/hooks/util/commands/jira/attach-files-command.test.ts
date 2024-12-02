import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { PatCredentials } from "../../../../client/authentication/credentials";
import { AxiosRestClient } from "../../../../client/https/https";
import type { JiraClient } from "../../../../client/jira/jira-client";
import { BaseJiraClient } from "../../../../client/jira/jira-client";
import { Level, LOG } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { AttachFilesCommand } from "./attach-files-command";

describe(relative(cwd(), __filename), async () => {
    await describe(AttachFilesCommand.name, async () => {
        await it("attaches files", async (context) => {
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
            const command = new AttachFilesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, ["image.jpg", "something.mp4"]),
                new ConstantCommand(LOG, "CYP-123")
            );
            assert.deepStrictEqual(await command.compute(), [
                { filename: "image.jpg", size: 12345 },
                { filename: "something.mp4", size: 54321 },
            ]);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.INFO,
                "Attaching files to test execution issue CYP-123",
            ]);
        });

        await it("does not throw without files to attach", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            const addAttachment = context.mock.method(jiraClient, "addAttachment");
            const command = new AttachFilesCommand(
                { jiraClient: jiraClient },
                LOG,
                new ConstantCommand(LOG, []),
                new ConstantCommand(LOG, "CYP-123")
            );
            assert.deepStrictEqual(await command.compute(), []);
            assert.strictEqual(addAttachment.mock.callCount(), 0);
        });
    });
});
