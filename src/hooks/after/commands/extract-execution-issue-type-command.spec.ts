import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { IssueTypeDetails } from "../../../types/jira/responses/issue-type-details";
import { dedent } from "../../../util/dedent";
import { ConstantCommand } from "../../util/commands/constant-command";
import { ExtractExecutionIssueTypeCommand } from "./extract-execution-issue-type-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(ExtractExecutionIssueTypeCommand.name, () => {
        it("extracts test execution issue types", async () => {
            const logger = getMockedLogger();
            const issueTypes = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueTypeCommand(
                {
                    displayCloudHelp: true,
                    projectKey: "CYP",
                    testExecutionIssueType: "Test Execution",
                },
                logger,
                new ConstantCommand(logger, issueTypes)
            );
            expect(await command.compute()).to.deep.eq({
                avatarId: 10515,
                description:
                    "This is the Xray Test Execution Issue Type. Used to execute test cases already defined.",
                hierarchyLevel: 0,
                iconUrl:
                    "https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10515?size=medium",
                id: "10008",
                name: "Test Execution",
                self: "https://example.org/rest/api/2/issuetype/10008",
                subtask: false,
                untranslatedName: "Test Execution",
            });
        });

        it("throws when the test execution types do not exist (cloud)", async () => {
            const logger = getMockedLogger();
            const issueTypes = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueTypeCommand(
                {
                    displayCloudHelp: true,
                    projectKey: "CYP",
                    testExecutionIssueType: "Nonexistent Execution",
                },
                logger,
                new ConstantCommand(logger, issueTypes)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to retrieve Jira issue type information of test execution issue type called: Nonexistent Execution

                    Make sure Xray's issue types have been added to project CYP or that you've configured any custom execution issue type accordingly

                      For example, the following plugin configuration will tell Xray to create Jira issues of type "My Custom Issue Type" to document test execution results:

                        {
                          jira: {
                            testExecutionIssueType: "My Custom Issue Type"
                          }
                        }

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                    - https://docs.getxray.app/display/XRAYCLOUD/Project+Settings%3A+Issue+Types+Mapping
                `)
            );
        });

        it("throws when the test execution types do not exist (server)", async () => {
            const logger = getMockedLogger();
            const issueTypes = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueTypeCommand(
                {
                    displayCloudHelp: false,
                    projectKey: "CYP",
                    testExecutionIssueType: "Nonexistent Execution",
                },
                logger,
                new ConstantCommand(logger, issueTypes)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to retrieve Jira issue type information of test execution issue type called: Nonexistent Execution

                    Make sure Xray's issue types have been added to project CYP or that you've configured any custom execution issue type accordingly

                      For example, the following plugin configuration will tell Xray to create Jira issues of type "My Custom Issue Type" to document test execution results:

                        {
                          jira: {
                            testExecutionIssueType: "My Custom Issue Type"
                          }
                        }

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                    - https://docs.getxray.app/display/XRAY/Configuring+a+Jira+project+to+be+used+as+an+Xray+Test+Project
                `)
            );
        });

        it("throws when multiple test execution types exist (cloud)", async () => {
            const logger = getMockedLogger();
            const issueTypes = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueTypeCommand(
                {
                    displayCloudHelp: true,
                    projectKey: "CYP",
                    testExecutionIssueType: "Task",
                },
                logger,
                new ConstantCommand(logger, issueTypes)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to retrieve Jira issue type information of test execution issue type called: Task

                    There are multiple issue types with this name, make sure to only make a single one available in project CYP:

                      Task: {"self":"https://example.org/rest/api/2/issuetype/10002","id":"10002","description":"Ein kleine, bestimmte Aufgabe.","iconUrl":"https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium","name":"Task","untranslatedName":"Task","subtask":false,"avatarId":10318,"hierarchyLevel":0}
                      Task: {"self":"https://example.org/rest/api/2/issuetype/10014","id":"10014","description":"Ein kleine, bestimmte Aufgabe.","iconUrl":"https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium","name":"Task","untranslatedName":"Task","subtask":false,"avatarId":10318,"hierarchyLevel":0,"scope":{"type":"PROJECT","project":{"id":"10008"}}}
                      Task: {"self":"https://example.org/rest/api/2/issuetype/10018","id":"10018","description":"Ein kleine, bestimmte Aufgabe.","iconUrl":"https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium","name":"Task","untranslatedName":"Task","subtask":false,"avatarId":10318,"hierarchyLevel":0,"scope":{"type":"PROJECT","project":{"id":"10009"}}}

                    If none of them is the test execution issue type you're using in project CYP, please specify the correct text execution issue type in the plugin configuration:

                      {
                        jira: {
                          testExecutionIssueType: "My Custom Issue Type"
                        }
                      }

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                    - https://docs.getxray.app/display/XRAYCLOUD/Project+Settings%3A+Issue+Types+Mapping
                `)
            );
        });

        it("throws when multiple test execution types exist (server)", async () => {
            const logger = getMockedLogger();
            const issueTypes = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueTypeCommand(
                {
                    displayCloudHelp: false,
                    projectKey: "CYP",
                    testExecutionIssueType: "Task",
                },
                logger,
                new ConstantCommand(logger, issueTypes)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to retrieve Jira issue type information of test execution issue type: Task

                    There are multiple issue types with this name, make sure to only make a single one available in project CYP:

                      Task: {"self":"https://example.org/rest/api/2/issuetype/10002","id":"10002","description":"Ein kleine, bestimmte Aufgabe.","iconUrl":"https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium","name":"Task","untranslatedName":"Task","subtask":false,"avatarId":10318,"hierarchyLevel":0}
                      Task: {"self":"https://example.org/rest/api/2/issuetype/10014","id":"10014","description":"Ein kleine, bestimmte Aufgabe.","iconUrl":"https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium","name":"Task","untranslatedName":"Task","subtask":false,"avatarId":10318,"hierarchyLevel":0,"scope":{"type":"PROJECT","project":{"id":"10008"}}}
                      Task: {"self":"https://example.org/rest/api/2/issuetype/10018","id":"10018","description":"Ein kleine, bestimmte Aufgabe.","iconUrl":"https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium","name":"Task","untranslatedName":"Task","subtask":false,"avatarId":10318,"hierarchyLevel":0,"scope":{"type":"PROJECT","project":{"id":"10009"}}}

                    If none of them is the test execution issue type you're using in project CYP, please specify the correct text execution issue type in the plugin configuration:

                      {
                        jira: {
                          testExecutionIssueType: "My Custom Issue Type"
                        }
                      }

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                    - https://docs.getxray.app/display/XRAY/Configuring+a+Jira+project+to+be+used+as+an+Xray+Test+Project
                `)
            );
        });
    });
});
