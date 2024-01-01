import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import {
    getMockedJiraClient,
    getMockedLogger,
    getMockedXrayClient,
} from "../../../../../test/mocks";
import { Level } from "../../../../logging/logging";
import { dedent } from "../../../../util/dedent";
import { ConstantCommand } from "../../../util";
import {
    GetTestTypeValuesCommandCloud,
    GetTestTypeValuesCommandServer,
} from "./getTestTypeValuesCommand";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(GetTestTypeValuesCommandServer.name, () => {
        it("fetches test types", async () => {
            const jiraClient = getMockedJiraClient();
            const command = new GetTestTypeValuesCommandServer(
                jiraClient,
                new ConstantCommand("customfield_12345"),
                new ConstantCommand(["CYP-123", "CYP-456", "CYP-789"])
            );
            jiraClient.search
                .withArgs({
                    jql: "issue in (CYP-123,CYP-456,CYP-789)",
                    fields: ["customfield_12345"],
                })
                .resolves([
                    { key: "CYP-123", fields: { ["customfield_12345"]: { value: "Cucumber" } } },
                    { key: "CYP-456", fields: { ["customfield_12345"]: { value: "Generic" } } },
                    { key: "CYP-789", fields: { ["customfield_12345"]: { value: "Manual" } } },
                ]);
            const summaries = await command.compute();
            expect(summaries).to.deep.eq({
                ["CYP-123"]: "Cucumber",
                ["CYP-456"]: "Generic",
                ["CYP-789"]: "Manual",
            });
        });

        it("displays a warning for issues which do not exist", async () => {
            const jiraClient = getMockedJiraClient();
            const command = new GetTestTypeValuesCommandServer(
                jiraClient,
                new ConstantCommand("customfield_12345"),
                new ConstantCommand(["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                    fields: ["customfield_12345"],
                })
                .resolves([
                    { key: "CYP-123", fields: { ["customfield_12345"]: { value: "Cucumber" } } },
                ]);
            const logger = getMockedLogger();
            expect(await command.compute()).to.deep.eq({
                ["CYP-123"]: "Cucumber",
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
            const command = new GetTestTypeValuesCommandServer(
                jiraClient,
                new ConstantCommand("customfield_12345"),
                new ConstantCommand(["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                    fields: ["customfield_12345"],
                })
                .resolves([
                    { key: "CYP-123", fields: { ["customfield_12345"]: { an: "object" } } },
                    {
                        key: "CYP-456",
                        fields: { bonjour: ["Where", "did", "I", "come", "from?"] },
                    },
                    { key: "CYP-789", fields: { ["customfield_12345"]: [42, 84] } },
                    { fields: { ["customfield_12345"]: { value: "Manual" } } },
                ]);
            const logger = getMockedLogger();
            expect(await command.compute()).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Failed to parse Jira field with ID customfield_12345 in issues:

                      CYP-123: Expected an object containing property 'value', but got: {"an":"object"}
                      CYP-456: Expected an object containing property 'customfield_12345', but got: {"bonjour":["Where","did","I","come","from?"]}
                      CYP-789: Expected an object containing property 'value', but got: [42,84]
                      Unknown: {"fields":{"customfield_12345":{"value":"Manual"}}}
                `)
            );
        });

        it("throws when encountering search failures", async () => {
            const jiraClient = getMockedJiraClient();
            const command = new GetTestTypeValuesCommandServer(
                jiraClient,
                new ConstantCommand("customfield_12345"),
                new ConstantCommand(["CYP-123", "CYP-789", "CYP-456"])
            );
            jiraClient.search
                .withArgs({
                    jql: "issue in (CYP-123,CYP-789,CYP-456)",
                    fields: ["customfield_12345"],
                })
                .rejects(new Error("Connection timeout"));
            await expect(command.compute()).to.eventually.be.rejectedWith("Connection timeout");
        });
    });

    describe(GetTestTypeValuesCommandCloud.name, () => {
        it("fetches test types", async () => {
            const xrayClient = getMockedXrayClient("cloud");
            const command = new GetTestTypeValuesCommandCloud(
                "CYP",
                xrayClient,
                new ConstantCommand(["CYP-123", "CYP-456", "CYP-789"])
            );
            xrayClient.getTestTypes.withArgs("CYP", "CYP-123", "CYP-456", "CYP-789").resolves({
                ["CYP-123"]: "Cucumber",
                ["CYP-456"]: "Generic",
                ["CYP-789"]: "Manual",
            });
            const summaries = await command.compute();
            expect(summaries).to.deep.eq({
                ["CYP-123"]: "Cucumber",
                ["CYP-456"]: "Generic",
                ["CYP-789"]: "Manual",
            });
        });

        it("displays a warning for issues which do not exist", async () => {
            const xrayClient = getMockedXrayClient("cloud");
            const command = new GetTestTypeValuesCommandCloud(
                "CYP",
                xrayClient,
                new ConstantCommand(["CYP-123", "CYP-789", "CYP-456"])
            );
            xrayClient.getTestTypes.withArgs("CYP", "CYP-123", "CYP-789", "CYP-456").resolves({
                ["CYP-123"]: "Cucumber",
            });
            const logger = getMockedLogger();
            expect(await command.compute()).to.deep.eq({
                ["CYP-123"]: "Cucumber",
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Failed to retrieve test types of issues:

                      CYP-456
                      CYP-789
                `)
            );
        });

        it("throws when encountering failures", async () => {
            const xrayClient = getMockedXrayClient("cloud");
            const command = new GetTestTypeValuesCommandCloud(
                "CYP",
                xrayClient,
                new ConstantCommand(["CYP-123", "CYP-789", "CYP-456"])
            );
            xrayClient.getTestTypes
                .withArgs("CYP", "CYP-123", "CYP-789", "CYP-456")
                .rejects(new Error("Connection timeout"));
            await expect(command.compute()).to.eventually.be.rejectedWith("Connection timeout");
        });
    });
});
