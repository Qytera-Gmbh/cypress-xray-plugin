import { expect } from "chai";
import { readFileSync } from "fs";
import { expectToExist } from "../../../test/util";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { getMultipartFeatures } from "./multipartFeatureConversion";

describe("getMultipartFeatures", () => {
    it("includes all tagged features and tests", async () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
        const features = getMultipartFeatures(cucumberReport);
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
        const features = getMultipartFeatures(cucumberReport, { testExecutionIssueKey: "CYP-456" });
        expect(features[0].tags).to.deep.eq([{ name: "@CYP-456" }]);
        expect(features[1].tags).to.deep.eq([{ name: "@CYP-456" }]);
    });

    it("uses the configured test execution issue key even if no tags are present", async () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
        const features = getMultipartFeatures(cucumberReport, { testExecutionIssueKey: "CYP-456" });
        expect(features[0].tags).to.deep.eq([{ name: "@CYP-456" }]);
        expect(features[1].tags).to.deep.eq([{ name: "@CYP-456" }]);
    });

    it("includes screenshots by default", async () => {
        const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
        const features = getMultipartFeatures(cucumberReport);
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
        const features = getMultipartFeatures(cucumberReport, { includeScreenshots: false });
        expect(features[0].elements[0].steps[0].embeddings).to.be.empty;
        expect(features[0].elements[0].steps[1].embeddings).to.be.empty;
        expect(features[0].elements[1].steps[0].embeddings).to.be.empty;
        expect(features[0].elements[1].steps[1].embeddings).to.be.empty;
        expect(features[0].elements[2].steps[0].embeddings).to.be.empty;
        expect(features[0].elements[2].steps[1].embeddings).to.be.empty;
    });
});
