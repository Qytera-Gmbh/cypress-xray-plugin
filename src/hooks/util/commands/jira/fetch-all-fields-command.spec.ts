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
import { FetchAllFieldsCommand } from "./fetch-all-fields-command";

describe(relative(cwd(), __filename), async () => {
    await describe(FetchAllFieldsCommand.name, async () => {
        await it("fetches fields", async (context) => {
            const jiraClient = new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            const fields = [
                {
                    clauseNames: ["labels"],
                    custom: false,
                    id: "labels",
                    name: "Labels",
                    navigable: true,
                    orderable: true,
                    schema: { items: "string", system: "labels", type: "array" },
                    searchable: true,
                },
                {
                    clauseNames: ["cf[12126]", "Test Plan"],
                    custom: true,
                    id: "customfield_12126",
                    name: "Test Plan",
                    navigable: true,
                    orderable: true,
                    schema: {
                        custom: "com.xpandit.plugins.xray:test-plan-custom-field",
                        customId: 12126,
                        type: "array",
                    },
                    searchable: true,
                },
            ];
            context.mock.method(
                jiraClient,
                "getFields",
                context.mock.fn<JiraClient["getFields"]>(async () => {
                    return await Promise.resolve(fields);
                })
            );
            const command = new FetchAllFieldsCommand({ jiraClient: jiraClient }, LOG);
            assert.deepStrictEqual(await command.compute(), fields);
        });
    });
});
