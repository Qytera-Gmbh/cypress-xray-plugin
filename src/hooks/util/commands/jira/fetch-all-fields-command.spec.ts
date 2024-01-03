import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedJiraClient } from "../../../../../test/mocks";
import { FetchAllFieldsCommand } from "./fetch-all-fields-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(FetchAllFieldsCommand.name, () => {
        it("fetches fields", async () => {
            const jiraClient = getMockedJiraClient();
            const fields = [
                {
                    id: "labels",
                    name: "Labels",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels"],
                    schema: { type: "array", items: "string", system: "labels" },
                },
                {
                    id: "customfield_12126",
                    name: "Test Plan",
                    custom: true,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["cf[12126]", "Test Plan"],
                    schema: {
                        type: "array",
                        custom: "com.xpandit.plugins.xray:test-plan-custom-field",
                        customId: 12126,
                    },
                },
            ];
            jiraClient.getFields.onFirstCall().resolves(fields);
            const command = new FetchAllFieldsCommand({ jiraClient: jiraClient });
            expect(await command.compute()).to.deep.eq(fields);
        });
    });
});
