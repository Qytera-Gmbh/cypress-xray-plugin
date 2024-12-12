import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { PatCredentials } from "../../../../client/authentication/credentials";
import { AxiosRestClient } from "../../../../client/https/requests";
import type { JiraClient } from "../../../../client/jira/jira-client";
import { BaseJiraClient } from "../../../../client/jira/jira-client";
import { LOG } from "../../../../util/logging";
import { FetchIssueTypesCommand } from "./fetch-issue-types-command";

describe(relative(cwd(), __filename), async () => {
    await describe(FetchIssueTypesCommand.name, async () => {
        await it("fetches issue types", async (context) => {
            const types = [
                {
                    avatarId: 10314,
                    description: "Test",
                    hierarchyLevel: 0,
                    iconUrl:
                        "https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10314?size=medium",
                    id: "10017",
                    name: "Test",
                    scope: {
                        project: {
                            id: "10008",
                        },
                        type: "PROJECT",
                    },
                    self: "https://example.org/rest/api/2/issuetype/10017",
                    subtask: false,
                    untranslatedName: "Test",
                },
                {
                    avatarId: 10315,
                    description: "Eine Funktionalität oder Funktion, ausgedrückt als Benutzerziel.",
                    hierarchyLevel: 0,
                    iconUrl:
                        "https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10315?size=medium",
                    id: "10001",
                    name: "Story",
                    self: "https://example.org/rest/api/2/issuetype/10001",
                    subtask: false,
                    untranslatedName: "Story",
                },
            ];
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                jiraClient,
                "getIssueTypes",
                context.mock.fn<JiraClient["getIssueTypes"]>(async () => {
                    return await Promise.resolve(types);
                })
            );
            const command = new FetchIssueTypesCommand({ jiraClient: jiraClient }, LOG);
            assert.deepStrictEqual(await command.compute(), types);
        });
    });
});
