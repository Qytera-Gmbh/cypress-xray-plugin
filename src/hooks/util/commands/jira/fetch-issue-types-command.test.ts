import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks.js";
import { FetchIssueTypesCommand } from "./fetch-issue-types-command.js";

chai.use(chaiAsPromised);

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(FetchIssueTypesCommand.name, async () => {
        await it("fetches issue types", async () => {
            const jiraClient = getMockedJiraClient();
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
            jiraClient.getIssueTypes.onFirstCall().resolves(types);
            const command = new FetchIssueTypesCommand(
                { jiraClient: jiraClient },
                getMockedLogger()
            );
            expect(await command.compute()).to.deep.eq(types);
        });
    });
});