import { expect } from "chai";
import fs from "fs";
import { stubLogging } from "../../test/util";
import { initOptions } from "../context";
import { InternalOptions } from "../types/plugin";
import { dedent } from "../util/dedent";
import {
    containsCucumberTest,
    containsNativeTest,
    getCucumberIssueData,
    getCucumberPreconditionIssueTags,
    getCucumberScenarioIssueTags,
    getNativeTestIssueKey,
    getNativeTestIssueKeys,
    parseFeatureFile,
} from "./preprocessing";

describe("cypress preprocessing", () => {
    let result: CypressCommandLine.CypressRunResult;
    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
                cucumber: {
                    featureFileExtension: ".feature",
                },
            }
        );
        result = JSON.parse(
            fs.readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
    });

    describe("getNativeTestIssueKeys", () => {
        it("returns valid issue keys", () => {
            const issueKeys = getNativeTestIssueKeys(result, options);
            expect(issueKeys).to.deep.eq(["CYP-40", "CYP-41", "CYP-49"]);
        });

        it("skips invalid or missing issue keys", () => {
            result = JSON.parse(fs.readFileSync("./test/resources/runResult.json", "utf-8"));
            const { stubbedWarning } = stubLogging();
            const issueKeys = getNativeTestIssueKeys(result, options);
            expect(issueKeys).to.deep.eq([]);
            expect(stubbedWarning).to.have.been.called.with.callCount(3);
            expect(stubbedWarning.getCall(0)).to.have.been.calledWithExactly(
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
            );
            expect(stubbedWarning.getCall(1)).to.have.been.calledWithExactly(
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
            );
            expect(stubbedWarning.getCall(2)).to.have.been.calledWithExactly(
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
            );
        });

        it("skips cucumber tests", () => {
            const { stubbedWarning } = stubLogging();
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            );
            const issueKeys = getNativeTestIssueKeys(result, options);
            expect(issueKeys).to.deep.eq(["CYP-330", "CYP-268", "CYP-237", "CYP-332", "CYP-333"]);
            expect(stubbedWarning).to.not.have.been.called;
        });
    });

    describe("containsNativeTest", () => {
        it("returns true", () => {
            expect(containsNativeTest(result, options)).to.be.true;
        });

        it("returns true for mixed runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            );
            expect(containsNativeTest(result, options)).to.be.true;
        });

        it("returns false for cucumber runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            );
            expect(containsNativeTest(result, options)).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            );
            options.cucumber = undefined;
            expect(containsNativeTest(result, options)).to.be.true;
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
    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
                cucumber: {
                    featureFileExtension: ".feature",
                    uploadFeatures: true,
                },
            }
        );
    });

    describe("server", () => {
        it("throws for missing scenario tags", () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedServerMissingScenario.feature",
                    options,
                    false
                )
            ).to.throw(
                dedent(`
                    No test issue keys found in tags of scenario: A scenario
                    You can target existing test issues by adding a corresponding tag:

                    @CYP-123
                    Scenario: A scenario
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("throws for multiple scenario tags", async () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedServerMultipleScenario.feature",
                    options,
                    false
                )
            ).to.throw(
                dedent(`
                    Multiple test issue keys found in tags of scenario: A scenario
                    The plugin cannot decide for you which one to use:

                    @CYP-123 @Some @Other @CYP-456 @Tags
                    ^^^^^^^^              ^^^^^^^^
                    Scenario: A scenario
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("should throw for missing background tags", async () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedServerMissingBackground.feature",
                    options,
                    false
                )
            ).to.throw(
                dedent(`
                    No precondition issue keys found in comments of background: A background
                    You can target existing precondition issues by adding a corresponding comment:

                    Background: A background
                      #@CYP-123
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("should throw for multiple background tags", async () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedServerMultipleBackground.feature",
                    options,
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
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("extracts xray server background tags", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedServerMultipleBackground.feature"
            );
            const tag = getCucumberPreconditionIssueTags(
                document.feature.children[0].background,
                "CYP",
                false,
                document.comments
            );
            expect(tag).to.deep.eq(["CYP-244", "CYP-262"]);
        });

        it("extracts xray server scenario tags", () => {
            const feature = parseFeatureFile(
                "./test/resources/features/taggedServerMultipleScenario.feature"
            ).feature;
            expect(
                getCucumberScenarioIssueTags(feature.children[1].scenario, "CYP", false)
            ).to.deep.eq(["CYP-123", "CYP-456"]);
        });
    });

    describe("cloud", () => {
        it("throws for missing scenario tags", async () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedCloudMissingScenario.feature",
                    options,
                    true
                )
            ).to.throw(
                dedent(`
                    No test issue keys found in tags of scenario: A scenario
                    You can target existing test issues by adding a corresponding tag:

                    @TestName:CYP-123
                    Scenario: A scenario
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("throws for multiple scenario tags", async () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedCloudMultipleScenario.feature",
                    options,
                    true
                )
            ).to.throw(
                dedent(`
                    Multiple test issue keys found in tags of scenario: A scenario
                    The plugin cannot decide for you which one to use:

                    @TestName:CYP-123 @Some @Other @TestName:CYP-456 @Tags
                    ^^^^^^^^^^^^^^^^^              ^^^^^^^^^^^^^^^^^
                    Scenario: A scenario
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("throws for missing background tags", async () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedCloudMissingBackground.feature",
                    options,
                    true
                )
            ).to.throw(
                dedent(`
                    No precondition issue keys found in comments of background: A background
                    You can target existing precondition issues by adding a corresponding comment:

                    Background: A background
                      #@Precondition:CYP-123
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("throws for multiple background tags", async () => {
            expect(() =>
                getCucumberIssueData(
                    "./test/resources/features/taggedCloudMultipleBackground.feature",
                    options,
                    true
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
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("extracts xray cloud background tags", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedCloudMultipleBackground.feature"
            );
            const tag = getCucumberPreconditionIssueTags(
                document.feature.children[0].background,
                "CYP",
                true,
                document.comments
            );
            expect(tag).to.deep.eq(["CYP-244", "CYP-262"]);
        });

        it("extracts xray cloud scenario tags", () => {
            const feature = parseFeatureFile(
                "./test/resources/features/taggedCloudMultipleScenario.feature"
            ).feature;
            expect(
                getCucumberScenarioIssueTags(feature.children[1].scenario, "CYP", true)
            ).to.deep.eq(["CYP-123", "CYP-456"]);
        });
    });

    describe("containsCucumberTest", () => {
        it("returns true", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            );
            expect(containsCucumberTest(result, options)).to.be.true;
        });

        it("returns true for mixed runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            );
            expect(containsCucumberTest(result, options)).to.be.true;
        });

        it("returns false for native runs", () => {
            const result = JSON.parse(fs.readFileSync("./test/resources/runResult.json", "utf-8"));
            expect(containsCucumberTest(result, options)).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            );
            options.cucumber = undefined;
            expect(containsCucumberTest(result, options)).to.be.false;
        });
    });
});
