import { expect } from "chai";
import dedent from "dedent";
import { initOptions } from "../context";
import { InternalOptions } from "../types/plugin";
import { preprocessFeatureFile } from "./preprocessor";

describe("the cucumber preprocessors", () => {
    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                    createTestIssues: false,
                },
                cucumber: {
                    featureFileExtension: ".feature",
                    uploadFeatures: true,
                },
            }
        );
    });

    describe("server", () => {
        it("should throw for missing scenario tags", () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedServerMissingScenario.feature",
                    options,
                    false
                )
            ).to.throw(
                dedent(`
                    Plugin is not allowed to create test issues for scenarios, but no test issue keys were found in tags of scenario: A scenario
                    You can target existing test issues by adding a corresponding tag:

                    @CYP-123
                    Scenario: A scenario
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                `)
            );
        });

        it("should throw for multiple scenario tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedServerMultipleScenario.feature",
                    options,
                    false
                )
            ).to.throw(
                dedent(`
                    Plugin is not allowed to create test issues for scenarios, but multiple test issue keys were found in tags of scenario: A scenario
                    The plugin cannot decide for you which one to use:

                    @CYP-123 @Some @Other @CYP-456 @Tags
                    ^^^^^^^^              ^^^^^^^^
                    Scenario: A scenario
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                `)
            );
        });

        it("should throw for missing background tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedServerMissingBackground.feature",
                    options,
                    false
                )
            ).to.throw(
                dedent(`
                    Plugin is not allowed to create precondition issues for backgrounds, but no precondition issue keys were found in comments of background: A background
                    You can target existing precondition issues by adding a corresponding comment:

                    Background: A background
                      #@Precondition:CYP-123
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                `)
            );
        });

        it("should throw for multiple background tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedServerMultipleBackground.feature",
                    options,
                    false
                )
            ).to.throw(
                dedent(`
                    Plugin is not allowed to create precondition issues for backgrounds, but multiple precondition issue keys were found in comments of background: A background
                    The plugin cannot decide for you which one to use:

                    Background: A background
                      #@Precondition:CYP-244
                      ^^^^^^^^^^^^^^^^^^^^^^
                      # a random comment
                      #@Precondition:CYP-262
                      ^^^^^^^^^^^^^^^^^^^^^^
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                `)
            );
        });
    });

    describe("cloud", () => {
        it("should throw for missing scenario tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedCloudMissingScenario.feature",
                    options,
                    true
                )
            ).to.throw(
                dedent(`
                    Plugin is not allowed to create test issues for scenarios, but no test issue keys were found in tags of scenario: A scenario
                    You can target existing test issues by adding a corresponding tag:

                    @TestName:CYP-123
                    Scenario: A scenario
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                `)
            );
        });

        it("should throw for multiple scenario tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedCloudMultipleScenario.feature",
                    options,
                    true
                )
            ).to.throw(
                dedent(`
                    Plugin is not allowed to create test issues for scenarios, but multiple test issue keys were found in tags of scenario: A scenario
                    The plugin cannot decide for you which one to use:

                    @TestName:CYP-123 @Some @Other @TestName:CYP-456 @Tags
                    ^^^^^^^^^^^^^^^^^              ^^^^^^^^^^^^^^^^^
                    Scenario: A scenario
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                `)
            );
        });

        it("should throw for missing background tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedCloudMissingBackground.feature",
                    options,
                    true
                )
            ).to.throw(
                dedent(`
                    Plugin is not allowed to create precondition issues for backgrounds, but no precondition issue keys were found in comments of background: A background
                    You can target existing precondition issues by adding a corresponding comment:

                    Background: A background
                      #@Precondition:CYP-123
                      # steps ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                `)
            );
        });

        it("should throw for multiple background tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedCloudMultipleBackground.feature",
                    options,
                    true
                )
            ).to.throw(
                dedent(`
                    Plugin is not allowed to create precondition issues for backgrounds, but multiple precondition issue keys were found in comments of background: A background
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
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#createtestissues
                `)
            );
        });
    });
});
