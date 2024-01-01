import { Background, Scenario } from "@cucumber/messages";
import { expect } from "chai";
import fs from "fs";
import { getMockedLogger } from "../../test/mocks";
import { dedent } from "./dedent";
import { Level } from "./logging";
import {
    containsCucumberTest,
    containsNativeTest,
    getCucumberIssueData,
    getCucumberPreconditionIssueComments,
    getCucumberPreconditionIssueTags,
    getCucumberScenarioIssueTags,
    getNativeTestIssueKey,
    getNativeTestIssueKeys,
    parseFeatureFile,
} from "./preprocessing";

describe("cypress preprocessing", () => {
    let result: CypressCommandLine.CypressRunResult;

    beforeEach(() => {
        result = JSON.parse(
            fs.readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        ) as CypressCommandLine.CypressRunResult;
    });

    describe("getNativeTestIssueKeys", () => {
        it("returns valid issue keys", () => {
            const issueKeys = getNativeTestIssueKeys(result, "CYP");
            expect(issueKeys).to.deep.eq(["CYP-40", "CYP-41", "CYP-49"]);
        });

        it("skips invalid or missing issue keys", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.WARNING,
                    dedent(`
                        Skipping test: xray upload demo should look for paragraph elements

                        No test issue keys found in title of test: should look for paragraph elements
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 should look for paragraph elements", () => {
                          // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                )
                .onFirstCall()
                .returns();
            logger.message
                .withArgs(
                    Level.WARNING,
                    dedent(`
                        Skipping test: xray upload demo should look for the anchor element

                        No test issue keys found in title of test: should look for the anchor element
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 should look for the anchor element", () => {
                          // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                )
                .onFirstCall()
                .returns();
            logger.message
                .withArgs(
                    Level.WARNING,
                    dedent(`
                        Skipping test: xray upload demo should fail

                        No test issue keys found in title of test: should fail
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 should fail", () => {
                          // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                )
                .onFirstCall()
                .returns();
            const issueKeys = getNativeTestIssueKeys(result, "CYP");
            expect(issueKeys).to.deep.eq([]);
        });

        it("skips cucumber tests", () => {
            const logger = getMockedLogger();
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const issueKeys = getNativeTestIssueKeys(result, "CYP", ".feature");
            expect(issueKeys).to.deep.eq(["CYP-330", "CYP-268", "CYP-237", "CYP-332", "CYP-333"]);
            expect(logger.message).to.not.have.been.called;
        });
    });

    describe("containsNativeTest", () => {
        it("returns true for native runs", () => {
            expect(containsNativeTest(result)).to.be.true;
        });

        it("returns true for mixed runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsNativeTest(result, ".feature")).to.be.true;
        });

        it("returns false for cucumber runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsNativeTest(result, ".feature")).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsNativeTest(result)).to.be.true;
        });
    });

    describe("getTestIssueKey", () => {
        it("should extract single test issue keys", () => {
            expect(getNativeTestIssueKey("this is CYP-123 a test", "CYP")).to.eq("CYP-123");
        });

        it("should log warnings for missing test issue keys", () => {
            expect(() => getNativeTestIssueKey("this is a test", "CYP")).to.throw(
                dedent(`
                    No test issue keys found in title of test: this is a test
                    You can target existing test issues by adding a corresponding issue key:

                    it("CYP-123 this is a test", () => {
                      // ...
                    });

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("should log warnings for multiple test issue keys", () => {
            expect(() =>
                getNativeTestIssueKey("CYP-123 this is a CYP-456 test CYP-789", "CYP")
            ).to.throw(
                dedent(`
                    Multiple test keys found in title of test: CYP-123 this is a CYP-456 test CYP-789
                    The plugin cannot decide for you which one to use:

                    it("CYP-123 this is a CYP-456 test CYP-789", () => {
                        ^^^^^^^           ^^^^^^^      ^^^^^^^
                      // ...
                    });

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });
    });
});

describe("cucumber preprocessing", () => {
    it("throws for missing scenario tags", () => {
        expect(() =>
            getCucumberIssueData(
                "./test/resources/features/taggedPrefixMissingScenario.feature",
                "CYP",
                true,
                { precondition: "Precondition:" }
            )
        ).to.throw(
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

    it("throws for wrong scenario tags", () => {
        expect(() =>
            getCucumberIssueData(
                "./test/resources/features/taggedWrongScenarioTags.feature",
                "CYP",
                false
            )
        ).to.throw(
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

    it("throws for missing background tags", () => {
        expect(() =>
            getCucumberIssueData(
                "./test/resources/features/taggedPrefixMissingBackground.feature",
                "CYP",
                true,
                { test: "TestName:" }
            )
        ).to.throw(
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

    it("throws for wrong background tags", () => {
        expect(() =>
            getCucumberIssueData(
                "./test/resources/features/taggedWrongBackgroundTags.feature",
                "CYP",
                false
            )
        ).to.throw(
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
        it("throws for multiple scenario tags", () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedNoPrefixMultipleScenario.feature",
                    "CYP",
                    false
                )
            ).to.throw(
                dedent(`
                    Multiple test issue keys found in tags of scenario: A scenario
                    The plugin cannot decide for you which one to use:

                    @CYP-123 @Some @Other @CYP-456 @Tags
                    ^^^^^^^^              ^^^^^^^^
                    Scenario: A scenario
                      Given an assumption
                      ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("should throw for multiple background tags", () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedNoPrefixMultipleBackground.feature",
                    "CYP",
                    false
                )
            ).to.throw(
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

        it("extracts relevant comments without prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            expect(comments).to.deep.eq(["#@CYP-244", "# a random comment", "#@CYP-262"]);
        });

        it("extracts background tags without prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            const tags = getCucumberPreconditionIssueTags(background, "CYP", comments);
            expect(tags).to.deep.eq(["CYP-244", "CYP-262"]);
        });

        it("extracts scenario tags without prefix", () => {
            const feature = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleScenario.feature"
            ).feature;
            // Cast because we know for certain it exists.
            const scenario = feature?.children[1].scenario as Scenario;
            expect(getCucumberScenarioIssueTags(scenario, "CYP")).to.deep.eq([
                "CYP-123",
                "CYP-456",
            ]);
        });
    });

    describe("prefixed", () => {
        it("throws for multiple scenario tags", () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedPrefixMultipleScenario.feature",
                    "CYP",
                    true,
                    { test: "TestName:", precondition: "Precondition:" }
                )
            ).to.throw(
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

        it("throws for multiple background tags", () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedPrefixMultipleBackground.feature",
                    "CYP",
                    true,
                    { precondition: "Precondition:" }
                )
            ).to.throw(
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

        it("extracts relevant comments with prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background: Background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            expect(comments).to.deep.eq([
                "#@Precondition:CYP-244",
                "# a random comment",
                "#@Precondition:CYP-262",
            ]);
        });

        it("extracts background tags with prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background: Background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            const tags = getCucumberPreconditionIssueTags(
                background,
                "CYP",
                comments,
                "Precondition:"
            );
            expect(tags).to.deep.eq(["CYP-244", "CYP-262"]);
        });

        it("extracts scenario tags with prefix", () => {
            const feature = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleScenario.feature"
            ).feature;
            // Cast because we know for certain it exists.
            const scenario: Scenario = feature?.children[1].scenario as Scenario;
            expect(getCucumberScenarioIssueTags(scenario, "CYP", "TestName:")).to.deep.eq([
                "CYP-123",
                "CYP-456",
            ]);
        });
    });

    describe("containsCucumberTest", () => {
        it("returns true for Cucumber runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsCucumberTest(result, ".feature")).to.be.true;
        });

        it("returns true for mixed runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsCucumberTest(result, ".feature")).to.be.true;
        });

        it("returns false for native runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsCucumberTest(result, ".feature")).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsCucumberTest(result)).to.be.false;
        });
    });
});
