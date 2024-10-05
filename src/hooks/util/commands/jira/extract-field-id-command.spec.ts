import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedLogger } from "../../../../../test/mocks";
import { dedent } from "../../../../util/dedent";
import { ConstantCommand } from "../constant-command";
import { ExtractFieldIdCommand, JiraField } from "./extract-field-id-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(ExtractFieldIdCommand.name, () => {
        it("extracts fields case-insensitively", async () => {
            const logger = getMockedLogger();
            const command = new ExtractFieldIdCommand(
                { field: JiraField.TEST_PLAN },
                logger,
                new ConstantCommand(logger, [
                    {
                        clauseNames: ["test plan"],
                        custom: false,
                        id: "customfield_12345",
                        name: "Test Plan",
                        navigable: true,
                        orderable: true,
                        schema: {
                            system: "test plan",
                            type: "string",
                        },
                        searchable: true,
                    },
                    {
                        clauseNames: ["description"],
                        custom: false,
                        id: "description",
                        name: "Description",
                        navigable: true,
                        orderable: true,
                        schema: {
                            system: "description",
                            type: "string",
                        },
                        searchable: true,
                    },
                ])
            );
            expect(await command.compute()).to.eq("customfield_12345");
        });

        it("throws for missing fields", async () => {
            const logger = getMockedLogger();
            const command = new ExtractFieldIdCommand(
                { field: JiraField.TEST_PLAN },
                logger,
                new ConstantCommand(logger, [
                    {
                        clauseNames: ["summary"],
                        custom: false,
                        id: "customfield_12345",
                        name: "Summary",
                        navigable: true,
                        orderable: true,
                        schema: {
                            system: "summary",
                            type: "string",
                        },
                        searchable: true,
                    },
                ])
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to fetch Jira field ID for field with name: test plan
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    Available fields:
                      name: "Summary" id: "customfield_12345"

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          testPlan: // corresponding field ID
                        }
                      }
                `)
            );
        });

        describe("throws for missing fields and displays a hint", () => {
            it(JiraField.TEST_ENVIRONMENTS, async () => {
                const logger = getMockedLogger();
                const command = new ExtractFieldIdCommand(
                    { field: JiraField.TEST_ENVIRONMENTS },
                    logger,
                    new ConstantCommand(logger, [])
                );
                await expect(command.compute()).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to fetch Jira field ID for field with name: test environments
                        Make sure the field actually exists and that your Jira language settings did not modify the field's name

                        You can provide field IDs directly without relying on language settings:

                          jira: {
                            fields: {
                              testEnvironments: // corresponding field ID
                            }
                          }
                    `)
                );
            });

            it(JiraField.TEST_PLAN, async () => {
                const logger = getMockedLogger();
                const command = new ExtractFieldIdCommand(
                    { field: JiraField.TEST_PLAN },
                    logger,
                    new ConstantCommand(logger, [])
                );
                await expect(command.compute()).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to fetch Jira field ID for field with name: test plan
                        Make sure the field actually exists and that your Jira language settings did not modify the field's name

                        You can provide field IDs directly without relying on language settings:

                          jira: {
                            fields: {
                              testPlan: // corresponding field ID
                            }
                          }
                    `)
                );
            });
        });

        it("throws for multiple fields", async () => {
            const logger = getMockedLogger();
            const command = new ExtractFieldIdCommand(
                { field: JiraField.TEST_PLAN },
                logger,
                new ConstantCommand(logger, [
                    {
                        clauseNames: ["Test Plan"],
                        custom: false,
                        id: "testPlan",
                        name: "Test Plan",
                        navigable: true,
                        orderable: true,
                        schema: {
                            system: "Test Plan",
                            type: "string",
                        },
                        searchable: true,
                    },
                    {
                        clauseNames: ["Test Plan (custom)"],
                        custom: false,
                        id: "customfield_12345",
                        name: "Test Plan",
                        navigable: true,
                        orderable: true,
                        schema: {
                            customId: 5125,
                            type: "string",
                        },
                        searchable: true,
                    },
                ])
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to fetch Jira field ID for field with name: test plan
                    There are multiple fields with this name

                    Duplicates:
                      clauseNames: ["Test Plan (custom)"], custom: false, id: "customfield_12345", name: "Test Plan", navigable: true, orderable: true, schema: {"customId":5125,"type":"string"}     , searchable: true
                      clauseNames: ["Test Plan"]         , custom: false, id: "testPlan"         , name: "Test Plan", navigable: true, orderable: true, schema: {"system":"Test Plan","type":"string"}, searchable: true

                    You can provide field IDs in the options:

                      jira: {
                        fields: {
                          testPlan: // "testPlan" or "customfield_12345"
                        }
                      }
                `)
            );
        });
    });
});
