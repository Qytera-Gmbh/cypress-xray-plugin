/// <reference types="cypress" />

import { expect } from "chai";
import { issuesByScenario } from "../../../src/cucumber/tagging";
import { parseFeatureFile } from "../../../src/util/parsing";
import { stubLogInfo, stubLogWarning } from "../../constants";

describe("the cucumber tag extractor", () => {
    it("should be able to extract Xray server tags", () => {
        const feature = parseFeatureFile("./test/resources/features/taggedServer.feature").feature;
        expect(feature).to.exist;
        const issueMapping = issuesByScenario(feature, "CYP");
        expect(issueMapping).to.have.key("A tagged scenario");
        expect(issueMapping["A tagged scenario"]).to.eq("CYP-103");
    });

    it("should be able to extract Xray cloud tags", () => {
        const feature = parseFeatureFile("./test/resources/features/taggedCloud.feature").feature;
        expect(feature).to.exist;
        const issueMapping = issuesByScenario(feature, "CYP");
        expect(issueMapping).to.have.key("A tagged scenario");
        expect(issueMapping["A tagged scenario"]).to.eq("CYP-857");
    });

    it("should be able to skip unrelated tags", () => {
        const feature = parseFeatureFile(
            "./test/resources/features/taggedServerUnrelated.feature"
        ).feature;
        const stubbedInfo = stubLogInfo();
        const issueMapping = issuesByScenario(feature, "CYP");
        expect(issueMapping).to.be.empty;
        expect(stubbedInfo).to.have.been.called.with.callCount(1);
        expect(stubbedInfo).to.have.been.calledWith(
            'No issue keys found in tags of scenario "A tagged scenario".'
        );
    });

    it("should be able to warn about multiple tags", () => {
        const feature = parseFeatureFile(
            "./test/resources/features/taggedServerMultiple.feature"
        ).feature;
        const stubbedWarn = stubLogWarning();
        const issueMapping = issuesByScenario(feature, "CYP");
        expect(issueMapping).to.be.empty;
        expect(stubbedWarn).to.have.been.called.with.callCount(1);
        expect(stubbedWarn).to.have.been.calledWith(
            'Multiple issue keys found in tags of scenario "A tagged scenario": CYP-123, CYP-456, CYP-789. Issue reuse will not work for this scenario.'
        );
    });
});
