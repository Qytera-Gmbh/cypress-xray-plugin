import { expect } from "chai";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/mocks";
import { expectToExist } from "../../../test/util";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "../../util/dedent";
import { buildMultipartFeatures } from "./multipartFeatureBuilder";

describe("buildMultipartFeatures", () => {
    it("includes all tagged features and tests", async () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
        const features = buildMultipartFeatures(cucumberReport, {
            projectKey: "CYP",
            useCloudTags: true,
            testPrefix: "TestName:",
        });
        expect(features).to.be.an("array").with.length(2);
        expect(features[0].elements).to.be.an("array").with.length(3);
        expect(features[1].elements).to.be.an("array").with.length(1);
    });

    it("uses the configured test execution issue key", async () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
        const features = buildMultipartFeatures(cucumberReport, {
            testExecutionIssueKey: "CYP-456",
            projectKey: "CYP",
            useCloudTags: true,
            testPrefix: "TestName:",
        });
        expect(features[0].tags).to.deep.eq([{ name: "@CYP-456" }]);
        expect(features[1].tags).to.deep.eq([{ name: "@CYP-456" }]);
    });

    it("includes screenshots if enabled", async () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
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

    it("skips embeddings if screenshots are disabled", async () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
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

    it("skips untagged scenarios", async () => {
        const { stubbedWarning } = stubLogging();
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartUntagged.json",
                "utf-8"
            )
        );
        const features = buildMultipartFeatures(cucumberReport, {
            includeScreenshots: false,
            projectKey: "CYP",
            useCloudTags: false,
        });
        expect(features).to.have.length(0);
        expect(stubbedWarning).to.have.been.calledOnceWithExactly(
            dedent(`
                Skipping result upload for scenario: Doing stuff

                No test issue keys found in tags of scenario: Doing stuff
                You can target existing test issues by adding a corresponding tag:

                @CYP-123
                Scenario: Doing stuff
                  When I prepare something
                  ...

                For more information, visit:
                - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
            `)
        );
    });

    it("skips scenarios with multiple tags", async () => {
        const { stubbedWarning } = stubLogging();
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartMultipleTags.json",
                "utf-8"
            )
        );
        const features = buildMultipartFeatures(cucumberReport, {
            includeScreenshots: false,
            projectKey: "CYP",
            useCloudTags: true,
            testPrefix: "TestName:",
        });
        expect(features).to.have.length(0);
        expect(stubbedWarning).to.have.been.calledOnceWithExactly(
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
        );
    });
});
