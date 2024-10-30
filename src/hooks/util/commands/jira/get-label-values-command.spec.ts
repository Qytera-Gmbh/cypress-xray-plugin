import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks";
import { dedent } from "../../../../util/dedent";
import { Level } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { GetLabelValuesCommand } from "./get-label-values-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(GetLabelValuesCommand.name, () => {
        it("fetches labels", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new GetLabelValuesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, ["CYP-123", "CYP-456", "CYP-789"])
            );
            jiraClient.search
                .withArgs({
                    fields: ["labels"],
                    jql: "issue in (CYP-123,CYP-456,CYP-789)",
                })
                .resolves([
                    { fields: { labels: ["label", "two labels"] }, key: "CYP-123" },
                    { fields: { labels: ["three labels"] }, key: "CYP-456" },
                    { fields: { labels: [] }, key: "CYP-789" },
                ]);
            const summaries = await command.compute();
            expect(summaries).to.deep.eq({
                ["CYP-123"]: ["label", "two labels"],
                ["CYP-456"]: ["three labels"],
                ["CYP-789"]: [],
            });
        });

        it("displays a warning for issues which do not exist", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new GetLabelValuesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, ["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    fields: ["labels"],
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                })
                .resolves([{ fields: { labels: ["label"] }, key: "CYP-123" }]);
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
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new GetLabelValuesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, ["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    fields: ["labels"],
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                })
                .resolves([
                    { fields: { labels: "string" }, key: "CYP-123" },
                    { fields: { bonjour: 42 }, key: "CYP-456" },
                    { fields: { labels: [42, 84] }, key: "CYP-789" },
                    { fields: { labels: ["hi", "there"] } },
                ]);
            expect(await command.compute()).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Failed to parse Jira field with ID labels in issues:

                      CYP-123: Value is not an array of type string: "string"
                      CYP-456: Expected an object containing property 'labels', but got: {"bonjour":42}
                      CYP-789: Value is not an array of type string: [42,84]
                      Unknown: {"fields":{"labels":["hi","there"]}}
                `)
            );
        });

        it("throws when encountering search failures", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new GetLabelValuesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, ["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    fields: ["labels"],
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                })
                .rejects(new Error("Connection timeout"));
            await expect(command.compute()).to.eventually.be.rejectedWith("Connection timeout");
        });
    });
});
