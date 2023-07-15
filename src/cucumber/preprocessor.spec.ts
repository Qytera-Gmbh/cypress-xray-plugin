import { expect } from "chai";
import { initOptions } from "../context";
import { InternalOptions } from "../types/plugin";
import { preprocessFeatureFile } from "./preprocessor";

describe("the cucumber preprocessor", () => {
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
        it("should be able to throw for missing scenario tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedServerMissingScenario.feature",
                    options,
                    false
                )
            ).to.throw(
                "Plugin is not allowed to create test issues for scenarios, but no test issue keys were found in tags of scenario: A scenario\n" +
                    "You can target existing test issues by adding a corresponding tag:\n" +
                    "\n" +
                    "@CYP-123\n" +
                    "Scenario: A scenario\n" +
                    "  # steps ...\n" +
                    "\n" +
                    "For more information, visit: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST"
            );
        });

        it("should be able to throw for multiple scenario tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedServerMultipleScenario.feature",
                    options,
                    false
                )
            ).to.throw(
                "Plugin is not allowed to create test issues for scenarios, but multiple test issue keys were found in tags of scenario: A scenario\n" +
                    "The plugin cannot decide for you which one to use:\n" +
                    "\n" +
                    "@CYP-123 @Some @Other @CYP-456 @Tags\n" +
                    "^^^^^^^^              ^^^^^^^^\n" +
                    "Scenario: A scenario\n" +
                    "  # steps ...\n" +
                    "\n" +
                    "For more information, visit: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST"
            );
        });

        it("should be able to throw for missing background tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedServerMissingBackground.feature",
                    options,
                    false
                )
            ).to.throw(
                "Plugin is not allowed to create precondition issues for backgrounds, but no precondition issue keys were found in comments of background: A background\n" +
                    "You can target existing precondition issues by adding a corresponding comment:\n" +
                    "\n" +
                    "Background: A background\n" +
                    "  #@Precondition:CYP-123\n" +
                    "  # steps ...\n" +
                    "\n" +
                    "For more information, visit: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST"
            );
        });

        it("should be able to throw for multiple background tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedServerMultipleBackground.feature",
                    options,
                    false
                )
            ).to.throw(
                "Plugin is not allowed to create precondition issues for backgrounds, but multiple precondition issue keys were found in comments of background: A background\n" +
                    "The plugin cannot decide for you which one to use:\n" +
                    "\n" +
                    "Background: A background\n" +
                    "  #@Precondition:CYP-244\n" +
                    "  ^^^^^^^^^^^^^^^^^^^^^^\n" +
                    "  # a random comment\n" +
                    "  #@Precondition:CYP-262\n" +
                    "  ^^^^^^^^^^^^^^^^^^^^^^\n" +
                    "  # steps ...\n" +
                    "\n" +
                    "For more information, visit: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST"
            );
        });
    });

    describe("cloud", () => {
        it("should be able to throw for missing scenario tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedCloudMissingScenario.feature",
                    options,
                    true
                )
            ).to.throw(
                "Plugin is not allowed to create test issues for scenarios, but no test issue keys were found in tags of scenario: A scenario\n" +
                    "You can target existing test issues by adding a corresponding tag:\n" +
                    "\n" +
                    "@TestName:CYP-123\n" +
                    "Scenario: A scenario\n" +
                    "  # steps ...\n" +
                    "\n" +
                    "For more information, visit: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2"
            );
        });

        it("should be able to throw for multiple scenario tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedCloudMultipleScenario.feature",
                    options,
                    true
                )
            ).to.throw(
                "Plugin is not allowed to create test issues for scenarios, but multiple test issue keys were found in tags of scenario: A scenario\n" +
                    "The plugin cannot decide for you which one to use:\n" +
                    "\n" +
                    "@TestName:CYP-123 @Some @Other @TestName:CYP-456 @Tags\n" +
                    "^^^^^^^^^^^^^^^^^              ^^^^^^^^^^^^^^^^^\n" +
                    "Scenario: A scenario\n" +
                    "  # steps ...\n" +
                    "\n" +
                    "For more information, visit: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2"
            );
        });

        it("should be able to throw for missing background tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedCloudMissingBackground.feature",
                    options,
                    true
                )
            ).to.throw(
                "Plugin is not allowed to create precondition issues for backgrounds, but no precondition issue keys were found in comments of background: A background\n" +
                    "You can target existing precondition issues by adding a corresponding comment:\n" +
                    "\n" +
                    "Background: A background\n" +
                    "  #@Precondition:CYP-123\n" +
                    "  # steps ...\n" +
                    "\n" +
                    "For more information, visit: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2"
            );
        });

        it("should be able to throw for multiple background tags", async () => {
            expect(() =>
                preprocessFeatureFile(
                    "./test/resources/features/taggedCloudMultipleBackground.feature",
                    options,
                    true
                )
            ).to.throw(
                "Plugin is not allowed to create precondition issues for backgrounds, but multiple precondition issue keys were found in comments of background: A background\n" +
                    "The plugin cannot decide for you which one to use:\n" +
                    "\n" +
                    "Background: A background\n" +
                    "  #@Precondition:CYP-244\n" +
                    "  ^^^^^^^^^^^^^^^^^^^^^^\n" +
                    "  # a random comment\n" +
                    "  #@Precondition:CYP-262\n" +
                    "  ^^^^^^^^^^^^^^^^^^^^^^\n" +
                    "  # steps ...\n" +
                    "\n" +
                    "For more information, visit: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2"
            );
        });
    });
});
