import { expect } from "chai";
import { readFileSync } from "fs";
import { getMockedLogger } from "../../../test/mocks";
import { expectToExist } from "../../../test/util";
import { Level } from "../../logging/logging";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "../../util/dedent";
import { buildMultipartFeatures } from "./multipartFeatureBuilder";

describe("buildMultipartFeatures", () => {
    it("includes all tagged features and tests", () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        ) as CucumberMultipartFeature[];
        const features = buildMultipartFeatures(cucumberReport, {
            projectKey: "CYP",
            useCloudTags: true,
            testPrefix: "TestName:",
        });
        expect(features).to.be.an("array").with.length(2);
        expect(features[0].elements).to.be.an("array").with.length(3);
        expect(features[1].elements).to.be.an("array").with.length(1);
    });

    it("uses the configured test execution issue key", () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        ) as CucumberMultipartFeature[];
        const features = buildMultipartFeatures(cucumberReport, {
            testExecutionIssueKey: "CYP-456",
            projectKey: "CYP",
            useCloudTags: true,
            testPrefix: "TestName:",
        });
        expect(features[0].tags).to.deep.eq([{ name: "@CYP-456" }]);
        expect(features[1].tags).to.deep.eq([{ name: "@CYP-456" }]);
    });

    it("includes screenshots if enabled", () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        ) as CucumberMultipartFeature[];
        const features = buildMultipartFeatures(cucumberReport, {
            includeScreenshots: true,
            projectKey: "CYP",
            useCloudTags: true,
            testPrefix: "TestName:",
        });
        expectToExist(features[0].elements[2].steps[1].embeddings);
        expect(features[0].elements[2].steps[1].embeddings).to.have.length(1);
        expect(features[0].elements[2].steps[1].embeddings[0].data).to.be.a("string");
        expect(features[0].elements[2].steps[1].embeddings[0].mime_type).to.eq("image/png");
    });

    it("skips embeddings if screenshots are disabled", () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        ) as CucumberMultipartFeature[];
        const features = buildMultipartFeatures(cucumberReport, {
            includeScreenshots: false,
            projectKey: "CYP",
            useCloudTags: true,
            testPrefix: "TestName:",
        });
        expect(features[0].elements[0].steps[0].embeddings).to.be.empty;
        expect(features[0].elements[0].steps[1].embeddings).to.be.empty;
        expect(features[0].elements[1].steps[0].embeddings).to.be.empty;
        expect(features[0].elements[1].steps[1].embeddings).to.be.empty;
        expect(features[0].elements[2].steps[0].embeddings).to.be.empty;
        expect(features[0].elements[2].steps[1].embeddings).to.be.empty;
    });

    it("skips untagged scenarios", () => {
        const logger = getMockedLogger();
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartUntagged.json",
                "utf-8"
            )
        ) as CucumberMultipartFeature[];
        logger.message
            .withArgs(
                Level.WARNING,
                dedent(`
                    Skipping result upload for scenario: Doing stuff

                    No test issue keys found in tags of scenario: Doing stuff

                    You can target existing test issues by adding a corresponding tag:

                      @CYP-123
                      Scenario: Doing stuff
                        When I prepare something
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
                        Scenario: Doing stuff
                          When I prepare something
                          ...

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                `)
            )
            .onFirstCall()
            .returns();
        const features = buildMultipartFeatures(cucumberReport, {
            includeScreenshots: false,
            projectKey: "CYP",
            useCloudTags: false,
        });
        expect(features).to.have.length(0);
    });

    it("skips scenarios with multiple tags", () => {
        const logger = getMockedLogger();
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartMultipleTags.json",
                "utf-8"
            )
        ) as CucumberMultipartFeature[];
        logger.message
            .withArgs(
                Level.WARNING,
                dedent(`
                    Skipping result upload for scenario: Doing stuff

                    Multiple test issue keys found in tags of scenario: Doing stuff
                    The plugin cannot decide for you which one to use:

                    @TestName:CYP-123 @TestName:CYP-456
                    ^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^
                    Scenario: Doing stuff
                      When I prepare something
                      ...

                    For more information, visit:
                    - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            )
            .onFirstCall()
            .returns();
        const features = buildMultipartFeatures(cucumberReport, {
            includeScreenshots: false,
            projectKey: "CYP",
            useCloudTags: true,
            testPrefix: "TestName:",
        });
        expect(features).to.have.length(0);
    });
});
