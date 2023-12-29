import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { dedent } from "../../../util/dedent";
import { ConstantCommand } from "../../constantCommand";
import { ExtractFieldIdCommand, JiraField } from "./extractFieldIdCommand";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(ExtractFieldIdCommand.name, () => {
        it("extracts fields case-insensitively", async () => {
            const command = new ExtractFieldIdCommand(
                JiraField.SUMMARY,
                new ConstantCommand([
                    {
                        id: "customfield_12345",
                        name: "Summary",
                        custom: false,
                        orderable: true,
                        navigable: true,
                        searchable: true,
                        clauseNames: ["summary"],
                        schema: {
                            type: "string",
                            system: "summary",
                        },
                    },
                    {
                        id: "description",
                        name: "Description",
                        custom: false,
                        orderable: true,
                        navigable: true,
                        searchable: true,
                        clauseNames: ["description"],
                        schema: {
                            type: "string",
                            system: "description",
                        },
                    },
                ])
            );
            expect(await command.compute()).to.eq("customfield_12345");
        });

        it("throws for missing fields", async () => {
            const command = new ExtractFieldIdCommand(
                JiraField.DESCRIPTION,
                new ConstantCommand([])
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to fetch Jira field ID for field with name: description
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          description: // corresponding field ID
                        }
                      }
                `)
            );
        });

        it("throws for missing fields and displays a hint", async () => {
            const command = new ExtractFieldIdCommand(
                JiraField.TEST_PLAN,
                new ConstantCommand([
                    {
                        id: "summary",
                        name: "Summary",
                        custom: false,
                        orderable: true,
                        navigable: true,
                        searchable: true,
                        clauseNames: ["summary"],
                        schema: {
                            type: "string",
                            system: "summary",
                        },
                    },
                    {
                        id: "description",
                        name: "Description",
                        custom: false,
                        orderable: true,
                        navigable: true,
                        searchable: true,
                        clauseNames: ["description"],
                        schema: {
                            type: "string",
                            system: "description",
                        },
                    },
                ])
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to fetch Jira field ID for field with name: test plan
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    Available fields:
                      name: "Description" id: "description"
                      name: "Summary"     id: "summary"

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          testPlan: // corresponding field ID
                        }
                      }
                `)
            );
        });

        it("throws for multiple fields", async () => {
            const command = new ExtractFieldIdCommand(
                JiraField.SUMMARY,
                new ConstantCommand([
                    {
                        id: "summary",
                        name: "summary",
                        custom: false,
                        orderable: true,
                        navigable: true,
                        searchable: true,
                        clauseNames: ["summary"],
                        schema: {
                            type: "string",
                            system: "summary",
                        },
                    },
                    {
                        id: "customfield_12345",
                        name: "Summary",
                        custom: false,
                        orderable: true,
                        navigable: true,
                        searchable: true,
                        clauseNames: ["summary (custom)"],
                        schema: {
                            type: "string",
                            customId: 5125,
                        },
                    },
                ])
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to fetch Jira field ID for field with name: summary
                    There are multiple fields with this name

                    Duplicates:
                      id: "customfield_12345", name: "Summary", custom: false, orderable: true, navigable: true, searchable: true, clauseNames: ["summary (custom)"], schema: {"type":"string","customId":5125}
                      id: "summary"          , name: "summary", custom: false, orderable: true, navigable: true, searchable: true, clauseNames: ["summary"]         , schema: {"type":"string","system":"summary"}

                    You can provide field IDs in the options:

                      jira: {
                        fields: {
                          summary: // "summary" or "customfield_12345"
                        }
                      }
                `)
            );
        });
    });
});
