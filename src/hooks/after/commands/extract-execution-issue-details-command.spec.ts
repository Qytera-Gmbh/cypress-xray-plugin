import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs";
import path from "path";
import { IssueTypeDetails } from "../../../types/jira/responses/issue-type-details";
import { dedent } from "../../../util/dedent";
import { ConstantCommand } from "../../util/commands/constant-command";
import { ExtractExecutionIssueDetailsCommand } from "./extract-execution-issue-details-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(ExtractExecutionIssueDetailsCommand.name, () => {
        it("extracts test execution issue details", async () => {
            const issueDetails = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueDetailsCommand(
                {
                    projectKey: "CYP",
                    testExecutionIssueType: "Test Execution",
                    displayCloudHelp: true,
                },
                new ConstantCommand(issueDetails)
            );
            expect(await command.compute()).to.deep.eq({
                self: "https://example.org/rest/api/2/issuetype/10008",
                id: "10008",
                description:
                    "This is the Xray Test Execution Issue Type. Used to execute test cases already defined.",
                iconUrl:
                    "https://example.org/rest/api/2/universal_avatar/view/type/issuetype/avatar/10515?size=medium",
                name: "Test Execution",
                untranslatedName: "Test Execution",
                subtask: false,
                avatarId: 10515,
                hierarchyLevel: 0,
            });
        });

        it("throws when the test execution details do not exist (cloud)", async () => {
            const issueDetails = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueDetailsCommand(
                {
                    projectKey: "CYP",
                    testExecutionIssueType: "Nonexistent Execution",
                    displayCloudHelp: true,
                },
                new ConstantCommand(issueDetails)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to retrieve Jira issue type information of test execution issue type: Nonexistent Execution

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

        it("throws when the test execution details do not exist (server)", async () => {
            const issueDetails = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueDetailsCommand(
                {
                    projectKey: "CYP",
                    testExecutionIssueType: "Nonexistent Execution",
                    displayCloudHelp: false,
                },
                new ConstantCommand(issueDetails)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to retrieve Jira issue type information of test execution issue type: Nonexistent Execution

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

        it("throws when multiple test execution details exist (cloud)", async () => {
            const issueDetails = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueDetailsCommand(
                {
                    projectKey: "CYP",
                    testExecutionIssueType: "Task",
                    displayCloudHelp: true,
                },
                new ConstantCommand(issueDetails)
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
                    - https://docs.getxray.app/display/XRAYCLOUD/Project+Settings%3A+Issue+Types+Mapping
                `)
            );
        });

        it("throws when multiple test execution details exist (server)", async () => {
            const issueDetails = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            ) as IssueTypeDetails[];
            const command = new ExtractExecutionIssueDetailsCommand(
                {
                    projectKey: "CYP",
                    testExecutionIssueType: "Task",
                    displayCloudHelp: false,
                },
                new ConstantCommand(issueDetails)
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
