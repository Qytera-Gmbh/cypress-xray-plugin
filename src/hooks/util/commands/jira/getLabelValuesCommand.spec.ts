import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks";
import { dedent } from "../../../../util/dedent";
import { Level } from "../../../../util/logging";
import { ConstantCommand } from "../constantCommand";
import { GetLabelValuesCommand } from "./getLabelValuesCommand";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(GetLabelValuesCommand.name, () => {
        it("fetches labels", async () => {
            const jiraClient = getMockedJiraClient();
            const command = new GetLabelValuesCommand(
                jiraClient,
                new ConstantCommand("labelId"),
                new ConstantCommand(["CYP-123", "CYP-456", "CYP-789"])
            );
            jiraClient.search
                .withArgs({
                    jql: "issue in (CYP-123,CYP-456,CYP-789)",
                    fields: ["labelId"],
                })
                .resolves([
                    { key: "CYP-123", fields: { labelId: ["label", "two labels"] } },
                    { key: "CYP-456", fields: { labelId: ["three labels"] } },
                    { key: "CYP-789", fields: { labelId: [] } },
                ]);
            const summaries = await command.compute();
            expect(summaries).to.deep.eq({
                ["CYP-123"]: ["label", "two labels"],
                ["CYP-456"]: ["three labels"],
                ["CYP-789"]: [],
            });
        });

        it("displays a warning for issues which do not exist", async () => {
            const jiraClient = getMockedJiraClient();
            const command = new GetLabelValuesCommand(
                jiraClient,
                new ConstantCommand("labelId"),
                new ConstantCommand(["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                    fields: ["labelId"],
                })
                .resolves([{ key: "CYP-123", fields: { labelId: ["label"] } }]);
            const logger = getMockedLogger();
            expect(await command.compute()).to.deep.eq({
                ["CYP-123"]: ["label"],
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Failed to find Jira issues:

                      CYP-456
                      CYP-789
                `)
            );
        });

        it("displays a warning for issues whose fields cannot be parsed", async () => {
            const jiraClient = getMockedJiraClient();
            const command = new GetLabelValuesCommand(
                jiraClient,
                new ConstantCommand("labelId"),
                new ConstantCommand(["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                    fields: ["labelId"],
                })
                .resolves([
                    { key: "CYP-123", fields: { labelId: "string" } },
                    { key: "CYP-456", fields: { bonjour: 42 } },
                    { key: "CYP-789", fields: { labelId: [42, 84] } },
                    { fields: { labelId: ["hi", "there"] } },
                ]);
            const logger = getMockedLogger();
            expect(await command.compute()).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Failed to parse Jira field with ID labelId in issues:

                      CYP-123: Value is not an array of type string: "string"
                      CYP-456: Expected an object containing property 'labelId', but got: {"bonjour":42}
                      CYP-789: Value is not an array of type string: [42,84]
                      Unknown: {"fields":{"labelId":["hi","there"]}}
                `)
            );
        });

        it("throws when encountering search failures", async () => {
            const jiraClient = getMockedJiraClient();
            const command = new GetLabelValuesCommand(
                jiraClient,
                new ConstantCommand("labelId"),
                new ConstantCommand(["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                    fields: ["labelId"],
                })
                .rejects(new Error("Connection timeout"));
            await expect(command.compute()).to.eventually.be.rejectedWith("Connection timeout");
        });
    });
});
