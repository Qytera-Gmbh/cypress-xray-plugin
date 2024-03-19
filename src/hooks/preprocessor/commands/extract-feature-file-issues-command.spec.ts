import { Background, GherkinDocument, Scenario } from "@cucumber/messages";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { dedent } from "../../../util/dedent";
import { ConstantCommand } from "../../util/commands/constant-command";
import { ExtractFeatureFileIssuesCommand } from "./extract-feature-file-issues-command";
import { parseFeatureFile } from "./parsing/gherkin";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(ExtractFeatureFileIssuesCommand.name, () => {
        it("extracts cucumber issue data", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixCorrect.feature"
            );
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: { test: "TestName:", precondition: "Precondition:" },
                    displayCloudHelp: true,
                },
                new ConstantCommand(document)
            );
            expect(await extractIssueKeysCommand.compute()).to.deep.eq({
                tests: [
                    {
                        key: "CYP-333",
                        summary: "Scenario 1",
                        tags: ["TestName:CYP-333", "TestSet:CYP-444"],
                    },
                    {
                        key: "CYP-555",
                        summary: "Scenario 2",
                        tags: ["TestName:CYP-555", "TestSet:CYP-444"],
                    },
                ],
                preconditions: [{ key: "CYP-222", summary: "" }],
            });
        });

        it("skips empty feature files", async () => {
            const document: GherkinDocument = {
                comments: [],
            };
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: {},
                    displayCloudHelp: true,
                },
                new ConstantCommand(document)
            );
            expect(await extractIssueKeysCommand.compute()).to.deep.eq({
                tests: [],
                preconditions: [],
            });
        });

        it("handles rules", async () => {
            const document: GherkinDocument = {
                feature: {
                    location: { line: 1 },
                    tags: [],
                    language: "en",
                    keyword: "Feature",
                    name: "Rule feature",
                    description: "",
                    children: [
                        {
                            rule: {
                                id: "123242-rule",
                                location: { line: 3 },
                                tags: [],
                                keyword: "Rule",
                                name: "A rule",
                                description: "",
                                children: [
                                    {
                                        background: {
                                            id: "123242-background",
                                            location: { line: 4 },
                                            keyword: "Background",
                                            name: "A background",
                                            description: "",
                                            steps: [
                                                {
                                                    id: "123242-background-given",
                                                    location: { line: 6 },
                                                    keyword: "Given",
                                                    text: "Something",
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        scenario: {
                                            id: "123242-scenario",
                                            location: { line: 8 },
                                            tags: [
                                                {
                                                    name: "@CYP-123",
                                                    location: { line: 7 },
                                                    id: "123242-scenario-tag",
                                                },
                                            ],
                                            keyword: "Scenario",
                                            name: "A scenario",
                                            description: "",
                                            steps: [],
                                            examples: [],
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
                comments: [{ location: { line: 5 }, text: "@CYP-456" }],
            };
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: {},
                    displayCloudHelp: true,
                },
                new ConstantCommand(document)
            );
            expect(await extractIssueKeysCommand.compute()).to.deep.eq({
                tests: [{ key: "CYP-123", summary: "A scenario", tags: ["CYP-123"] }],
                preconditions: [{ key: "CYP-456", summary: "A background" }],
            });
        });

        it("throws for missing scenario tags", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMissingScenario.feature"
            );
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: { precondition: "Precondition:" },
                    displayCloudHelp: true,
                },
                new ConstantCommand(document)
            );
            await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    No test issue keys found in tags of scenario: A scenario

                    You can target existing test issues by adding a corresponding tag:

                      @CYP-123
                      Scenario: A scenario
                        Given an assumption
                        ...

                    You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                      Plugin configuration:

                        {
                          cucumber: {
                            prefixes: {
                              test: "TestName:"
                            }
                          }
                        }

                      Feature file:

                        @TestName:CYP-123
                        Scenario: A scenario
                          Given an assumption
                          ...

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                `)
            );
        });

        it("throws for missing scenario tags (no scenario name)", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMissingScenario.feature"
            );
            // Cast because we know for certain it exists.
            const scenario = document.feature?.children[1].scenario as Scenario;
            scenario.name = "";
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: { precondition: "Precondition:" },
                    displayCloudHelp: true,
                },
                new ConstantCommand(document)
            );
            await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    No test issue keys found in tags of scenario

                    You can target existing test issues by adding a corresponding tag:

                      @CYP-123
                      Scenario:
                        Given an assumption
                        ...

                    You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                      Plugin configuration:

                        {
                          cucumber: {
                            prefixes: {
                              test: "TestName:"
                            }
                          }
                        }

                      Feature file:

                        @TestName:CYP-123
                        Scenario:
                          Given an assumption
                          ...

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                `)
            );
        });

        it("throws for wrong scenario tags", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedWrongScenarioTags.feature"
            );
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: {},
                    displayCloudHelp: false,
                },
                new ConstantCommand(document)
            );
            await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    No test issue keys found in tags of scenario: A scenario

                    Available tags:
                      @Test:CYP-123
                      @Cool
                      @Lucky:CYP-415

                    If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray

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
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                `)
            );
        });

        it("throws for wrong scenario tags (no scenario name, no steps)", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedWrongScenarioTags.feature"
            );
            // Cast because we know for certain it exists.
            const scenario = document.feature?.children[1].scenario as Scenario;
            scenario.name = "";
            scenario.steps = [];
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: {},
                    displayCloudHelp: true,
                },
                new ConstantCommand(document)
            );
            await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    No test issue keys found in tags of scenario

                    Available tags:
                      @Test:CYP-123
                      @Cool
                      @Lucky:CYP-415

                    If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray

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
                        Scenario:
                          Given A step
                          ...

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                `)
            );
        });

        it("throws for missing background tags", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMissingBackground.feature"
            );
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: { test: "TestName:" },
                    displayCloudHelp: true,
                },
                new ConstantCommand(document)
            );
            await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    No precondition issue keys found in comments of background: A background

                    You can target existing precondition issues by adding a corresponding comment:

                      Background: A background
                        #@CYP-123
                        Given abc123
                        ...

                    You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                      Plugin configuration:

                        {
                          cucumber: {
                            prefixes: {
                              precondition: "Precondition:"
                            }
                          }
                        }

                      Feature file:

                        Background: A background
                          #@Precondition:CYP-123
                          Given abc123
                          ...

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                `)
            );
        });

        it("throws for missing background tags (no background steps and names)", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMissingBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            background.steps = [];
            background.name = "";
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: { test: "TestName:" },
                    displayCloudHelp: false,
                },
                new ConstantCommand(document)
            );
            await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    No precondition issue keys found in comments of background

                    You can target existing precondition issues by adding a corresponding comment:

                      Background:
                        #@CYP-123
                        Given A step
                        ...

                    You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                      Plugin configuration:

                        {
                          cucumber: {
                            prefixes: {
                              precondition: "Precondition:"
                            }
                          }
                        }

                      Feature file:

                        Background:
                          #@Precondition:CYP-123
                          Given A step
                          ...

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                `)
            );
        });

        it("throws for wrong background tags (no background name)", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedWrongBackgroundTags.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            background.name = "";
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: {},
                    displayCloudHelp: true,
                },
                new ConstantCommand(document)
            );
            await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    No precondition issue keys found in comments of background

                    Available comments:
                      #@HairConditioning:CYP-244
                      #@PavlovConditioning:CYP-784

                    If a comment contains the precondition issue key already, specify a global prefix to align the plugin with Xray

                      For example, with the following plugin configuration:

                        {
                          cucumber: {
                            prefixes: {
                              precondition: "Precondition:"
                            }
                          }
                        }

                      The following comment will be recognized as a precondition issue tag by the plugin:

                        Background:
                          #@Precondition:CYP-123
                          Given abc123
                          ...

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                `)
            );
        });

        it("throws for wrong background tags", async () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedWrongBackgroundTags.feature"
            );
            const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                {
                    projectKey: "CYP",
                    prefixes: {},
                    displayCloudHelp: false,
                },
                new ConstantCommand(document)
            );
            await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    No precondition issue keys found in comments of background: A background

                    Available comments:
                      #@HairConditioning:CYP-244
                      #@PavlovConditioning:CYP-784

                    If a comment contains the precondition issue key already, specify a global prefix to align the plugin with Xray

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
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                `)
            );
        });

        describe("no prefix", () => {
            it("throws for multiple scenario tags (no scenario name, no steps)", async () => {
                const document = parseFeatureFile(
                    "./test/resources/features/taggedNoPrefixMultipleScenario.feature"
                );
                // Cast because we know for certain it exists.
                const scenario = document.feature?.children[1].scenario as Scenario;
                scenario.name = "";
                scenario.steps = [];
                const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                    {
                        projectKey: "CYP",
                        prefixes: {},
                        displayCloudHelp: false,
                    },
                    new ConstantCommand(document)
                );
                await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                    dedent(`
                        Multiple test issue keys found in tags of scenario
                        The plugin cannot decide for you which one to use:

                        @CYP-123 @Some @Other @CYP-456 @Tags
                        ^^^^^^^^              ^^^^^^^^
                        Scenario:
                          Given A step
                          ...

                        For more information, visit:
                        - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            });

            it("throws for multiple background tags", async () => {
                const document = parseFeatureFile(
                    "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
                );
                const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                    {
                        projectKey: "CYP",
                        prefixes: {},
                        displayCloudHelp: false,
                    },
                    new ConstantCommand(document)
                );
                await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                    dedent(`
                        Multiple precondition issue keys found in comments of background: A background
                        The plugin cannot decide for you which one to use:

                        Background: A background
                          #@CYP-244
                          ^^^^^^^^^
                          # a random comment
                          #@CYP-262
                          ^^^^^^^^^
                          Given abc123
                          ...

                        For more information, visit:
                        - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            });

            it("throws for multiple background tags (no background name)", async () => {
                const document = parseFeatureFile(
                    "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
                );
                // Cast because we know for certain it exists.
                const background = document.feature?.children[0].background as Background;
                background.name = "";
                const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                    {
                        projectKey: "CYP",
                        prefixes: {},
                        displayCloudHelp: false,
                    },
                    new ConstantCommand(document)
                );
                await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                    dedent(`
                        Multiple precondition issue keys found in comments of background
                        The plugin cannot decide for you which one to use:

                        Background:
                          #@CYP-244
                          ^^^^^^^^^
                          # a random comment
                          #@CYP-262
                          ^^^^^^^^^
                          Given abc123
                          ...

                        For more information, visit:
                        - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            });
        });

        describe("prefixed", () => {
            it("throws for multiple scenario tags", async () => {
                const document = parseFeatureFile(
                    "./test/resources/features/taggedPrefixMultipleScenario.feature"
                );
                const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                    {
                        projectKey: "CYP",
                        prefixes: { test: "TestName:", precondition: "Precondition:" },
                        displayCloudHelp: true,
                    },
                    new ConstantCommand(document)
                );
                await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                    dedent(`
                        Multiple test issue keys found in tags of scenario: A scenario
                        The plugin cannot decide for you which one to use:

                        @TestName:CYP-123 @Some @Other @TestName:CYP-456 @Tags
                        ^^^^^^^^^^^^^^^^^              ^^^^^^^^^^^^^^^^^
                        Scenario: A scenario
                          Given an assumption
                          ...

                        For more information, visit:
                        - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            });

            it("throws for multiple background tags", async () => {
                const document = parseFeatureFile(
                    "./test/resources/features/taggedPrefixMultipleBackground.feature"
                );
                const extractIssueKeysCommand = new ExtractFeatureFileIssuesCommand(
                    {
                        projectKey: "CYP",
                        prefixes: { precondition: "Precondition:" },
                        displayCloudHelp: true,
                    },
                    new ConstantCommand(document)
                );
                await expect(extractIssueKeysCommand.compute()).to.eventually.be.rejectedWith(
                    dedent(`
                        Multiple precondition issue keys found in comments of background: A background
                        The plugin cannot decide for you which one to use:

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
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            });
        });
    });
});
