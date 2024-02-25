import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedJiraClient } from "../../../../../test/mocks";
import { FetchIssueTypesCommand } from "./fetch-issue-types-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(FetchIssueTypesCommand.name, () => {
        it("fetches issue types", async () => {
            const jiraClient = getMockedJiraClient();
            const types = [
                {
                    self: "https://example.org/rest/api/2/issuetype/10017",
                    id: "10017",
                    description: "Test",
                    iconUrl:
                        "https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10314?size=medium",
                    name: "Test",
                    untranslatedName: "Test",
                    subtask: false,
                    avatarId: 10314,
                    hierarchyLevel: 0,
                    scope: {
                        type: "PROJECT",
                        project: {
                            id: "10008",
                        },
                    },
                },
                {
                    self: "https://example.org/rest/api/2/issuetype/10001",
                    id: "10001",
                    description: "Eine Funktionalität oder Funktion, ausgedrückt als Benutzerziel.",
                    iconUrl:
                        "https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10315?size=medium",
                    name: "Story",
                    untranslatedName: "Story",
                    subtask: false,
                    avatarId: 10315,
                    hierarchyLevel: 0,
                },
            ];
            jiraClient.getIssueTypes.onFirstCall().resolves(types);
            const command = new FetchIssueTypesCommand({ jiraClient: jiraClient });
            expect(await command.compute()).to.deep.eq(types);
        });
    });
});
