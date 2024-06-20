import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks";
import { dedent } from "../../../../util/dedent";
import { Level } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { GetSummaryValuesCommand } from "./get-summary-values-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(GetSummaryValuesCommand.name, () => {
        it("fetches summaries", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new GetSummaryValuesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, "customfield_12345"),
                new ConstantCommand(logger, ["CYP-123", "CYP-456", "CYP-789"])
            );
            jiraClient.search
                .withArgs({
                    fields: ["customfield_12345"],
                    jql: "issue in (CYP-123,CYP-456,CYP-789)",
                })
                .resolves([
                    { fields: { ["customfield_12345"]: "Hello" }, key: "CYP-123" },
                    { fields: { ["customfield_12345"]: "Good Morning" }, key: "CYP-456" },
                    { fields: { ["customfield_12345"]: "Goodbye" }, key: "CYP-789" },
                ]);
            const summaries = await command.compute();
            expect(summaries).to.deep.eq({
                ["CYP-123"]: "Hello",
                ["CYP-456"]: "Good Morning",
                ["CYP-789"]: "Goodbye",
            });
        });

        it("displays a warning for issues which do not exist", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new GetSummaryValuesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, "customfield_12345"),
                new ConstantCommand(logger, ["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    fields: ["customfield_12345"],
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                })
                .resolves([{ fields: { ["customfield_12345"]: "Hello" }, key: "CYP-123" }]);
            expect(await command.compute()).to.deep.eq({
                ["CYP-123"]: "Hello",
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
            const command = new GetSummaryValuesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, "customfield_12345"),
                new ConstantCommand(logger, ["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    fields: ["customfield_12345"],
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                })
                .resolves([
                    { fields: { ["customfield_12345"]: { an: "object" } }, key: "CYP-123" },
                    {
                        fields: { bonjour: ["Where", "did", "I", "come", "from?"] },
                        key: "CYP-456",
                    },
                    { fields: { ["customfield_12345"]: [42, 84] }, key: "CYP-789" },
                    { fields: { ["customfield_12345"]: "hi" } },
                ]);
            expect(await command.compute()).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Failed to parse Jira field with ID customfield_12345 in issues:

                      CYP-123: Value is not of type string: {"an":"object"}
                      CYP-456: Expected an object containing property 'customfield_12345', but got: {"bonjour":["Where","did","I","come","from?"]}
                      CYP-789: Value is not of type string: [42,84]
                      Unknown: {"fields":{"customfield_12345":"hi"}}
                `)
            );
        });

        it("throws when encountering search failures", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new GetSummaryValuesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, "customfield_12345"),
                new ConstantCommand(logger, ["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    fields: ["customfield_12345"],
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                })
                .rejects(new Error("Connection timeout"));
            await expect(command.compute()).to.eventually.be.rejectedWith("Connection timeout");
        });
    });
});
