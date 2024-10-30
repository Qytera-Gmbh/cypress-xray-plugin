import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks";
import { FetchAllFieldsCommand } from "./fetch-all-fields-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(FetchAllFieldsCommand.name, () => {
        it("fetches fields", async () => {
            const jiraClient = getMockedJiraClient();
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
            jiraClient.getFields.onFirstCall().resolves(fields);
            const command = new FetchAllFieldsCommand(
                { jiraClient: jiraClient },
                getMockedLogger()
            );
            expect(await command.compute()).to.deep.eq(fields);
        });
    });
});
