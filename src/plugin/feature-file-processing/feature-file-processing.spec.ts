import assert from "node:assert";
import path, { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";
import featureFileProcessing from "./feature-file-processing";

void describe(relative(cwd(), __filename), () => {
    void describe(featureFileProcessing.processFeatureFiles.name, () => {
        void it("does nothing if no feature files are specified", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = featureFileProcessing.processFeatureFiles({
                displayCloudHelp: false,
                featureFilePaths: [],
                logger: { message: messageMock },
                options: { cucumber: {}, jira: { projectKey: "CYP" } },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(messageMock.mock.calls, []);
        });

        void it("handles unparseable feature files", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = featureFileProcessing.processFeatureFiles({
                displayCloudHelp: false,
                featureFilePaths: [
                    "/path/to/nonexistent-file.feature",
                    "./test/resources/features/invalid.feature",
                ],
                logger: { message: messageMock },
                options: { cucumber: {}, jira: { projectKey: "CYP" } },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "error",
                        dedent(`
                            /path/to/nonexistent-file.feature

                              Failed to parse feature file:

                                ENOENT: no such file or directory, open '${path.resolve("/path/to/nonexistent-file.feature")}'
                        `),
                    ],
                    [
                        "error",
                        dedent(`
                            ./test/resources/features/invalid.feature

                              Failed to parse feature file:

                                Parser errors:
                                (9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'
                        `),
                    ],
                ]
            );
        });

        void it("returns feature file issue data", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = featureFileProcessing.processFeatureFiles({
                displayCloudHelp: false,
                featureFilePaths: ["./test/resources/features/taggedPrefixCorrect.feature"],
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: { precondition: "Precondition:", test: "TestName:" } },
                    jira: { projectKey: "CYP" },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    allIssueKeys: ["CYP-222", "CYP-333", "CYP-555"],
                    filePath: "./test/resources/features/taggedPrefixCorrect.feature",
                },
            ]);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                []
            );
        });

        void it("skips empty feature files", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = featureFileProcessing.processFeatureFiles({
                displayCloudHelp: false,
                featureFilePaths: ["./test/resources/features/empty.feature"],
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: {} },
                    jira: { projectKey: "CYP" },
                },
            });
            assert.deepStrictEqual(result, [
                { allIssueKeys: [], filePath: "./test/resources/features/empty.feature" },
            ]);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                []
            );
        });

        void it("handles feature files with missing scenario tags", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = featureFileProcessing.processFeatureFiles({
                displayCloudHelp: true,
                featureFilePaths: ["./test/resources/features/taggedPrefixMissingScenario.feature"],
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: { precondition: "Precondition:" } },
                    jira: { projectKey: "CYP" },
                },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "error",
                        dedent(`
                            ./test/resources/features/taggedPrefixMissingScenario.feature

                              Scenario: A scenario

                                No test issue keys found in tags:



                                If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray.

                                  For example, with the following plugin configuration:

                                    {
                                      cucumber: {
                                        prefixes: {
                                          test: "TestName:"
                                        }
                                      }
                                    }

                                  The following tag will be recognized as a test issue tag by the plugin:

                                    @TestName:CYP-123
                                    Scenario: A scenario
                                      Given an assumption
                                      ...

                                For more information, visit:
                                - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                                - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                                - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                        `),
                    ],
                ]
            );
        });

        void it("handles feature files with multiple scenario tags", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = featureFileProcessing.processFeatureFiles({
                displayCloudHelp: true,
                featureFilePaths: [
                    "./test/resources/features/taggedPrefixMultipleScenario.feature",
                ],
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: { precondition: "Precondition:", test: "TestName:" } },
                    jira: { projectKey: "CYP" },
                },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "error",
                        dedent(`
                            ./test/resources/features/taggedPrefixMultipleScenario.feature

                              Scenario: A scenario

                                Multiple test issue keys found in the scenario's tags. Xray will only take one into account, you have to decide which one to use:

                                  @TestName:CYP-123 @Some @Other @TestName:CYP-456 @Tags
                                  ^^^^^^^^^^^^^^^^^              ^^^^^^^^^^^^^^^^^
                                  Scenario: A scenario
                                    Given an assumption
                                    ...

                                For more information, visit:
                                - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                                - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                        `),
                    ],
                ]
            );
        });

        void it("handles feature files with missing background tags", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = featureFileProcessing.processFeatureFiles({
                displayCloudHelp: true,
                featureFilePaths: [
                    "./test/resources/features/taggedPrefixMissingBackground.feature",
                ],
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: { projectKey: "CYP" },
                },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "error",
                        dedent(`
                            ./test/resources/features/taggedPrefixMissingBackground.feature

                              Background: A background

                                No precondition issue keys found in comments:



                                If a comment contains the precondition issue key already, specify a global prefix to align the plugin with Xray.

                                  For example, with the following plugin configuration:

                                    {
                                      cucumber: {
                                        prefixes: {
                                          precondition: "Precondition:"
                                        }
                                      }
                                    }

                                  The following comment will be recognized as a precondition issue tag by the plugin:

                                    Background: A background
                                      #@Precondition:CYP-123
                                      Given abc123
                                      ...

                                For more information, visit:
                                - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                                - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                                - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                        `),
                    ],
                ]
            );
        });

        void it("handles feature files with multiple background tags", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = featureFileProcessing.processFeatureFiles({
                displayCloudHelp: true,
                featureFilePaths: [
                    "./test/resources/features/taggedPrefixMultipleBackground.feature",
                ],
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: { precondition: "Precondition:" } },
                    jira: { projectKey: "CYP" },
                },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "error",
                        dedent(`
                            ./test/resources/features/taggedPrefixMultipleBackground.feature

                              Background: A background

                                Multiple precondition issue keys found in the background's comments. Xray will only take one into account, you have to decide which one to use:

                                  Background: A background
                                    #@Precondition:CYP-244
                                    ^^^^^^^^^^^^^^^^^^^^^^
                                    # a random comment
                                    #@Precondition:CYP-262
                                    ^^^^^^^^^^^^^^^^^^^^^^
                                    Given abc123
                                    ...

                                For more information, visit:
                                - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                                - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                        `),
                    ],
                ]
            );
        });
    });
});
