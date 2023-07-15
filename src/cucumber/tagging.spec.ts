import { expect } from "chai";
import { getPreconditionIssueTags, getTestIssueTags, parseFeatureFile } from "./tagging";

describe("the cucumber tag extractor", () => {
    it("should be able to extract xray server background tags", () => {
        const document = parseFeatureFile(
            "./test/resources/features/taggedServerMultipleBackground.feature"
        );
        const tag = getPreconditionIssueTags(
            document.feature.children[0].background,
            "CYP",
            document.comments
        );
        expect(tag).to.deep.eq(["CYP-244", "CYP-262"]);
    });
    it("should be able to extract xray cloud background tags", () => {
        const document = parseFeatureFile(
            "./test/resources/features/taggedCloudMultipleBackground.feature"
        );
        const tag = getPreconditionIssueTags(
            document.feature.children[0].background,
            "CYP",
            document.comments
        );
        expect(tag).to.deep.eq(["CYP-244", "CYP-262"]);
    });

    it("should be able to extract xray server scenario tags", () => {
        const feature = parseFeatureFile(
            "./test/resources/features/taggedServerMultipleScenario.feature"
        ).feature;
        expect(getTestIssueTags(feature.children[1].scenario, "CYP")).to.deep.eq([
            "CYP-123",
            "CYP-456",
        ]);
    });

    it("should be able to extract xray cloud scenario tags", () => {
        const feature = parseFeatureFile(
            "./test/resources/features/taggedCloudMultipleScenario.feature"
        ).feature;
        expect(getTestIssueTags(feature.children[1].scenario, "CYP")).to.deep.eq([
            "CYP-123",
            "CYP-456",
        ]);
    });
});
