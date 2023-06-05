/// <reference types="cypress" />

import { expect } from "chai";
import { CONTEXT, initContext } from "../../../src/context";
import { issuesByScenario } from "../../../src/cucumber/tagging";
import { parseFeatureFile } from "../../../src/util/parsing";
import { stubLogError, stubLogInfo } from "../../constants";
import { DummyXrayClient, expectToExist } from "../helpers";

describe("the cucumber tag extractor", () => {
    beforeEach(() => {
        initContext({
            jira: {
                projectKey: "CYP",
            },
        });
        CONTEXT.xrayClient = new DummyXrayClient();
    });

    it("should be able to extract Xray server tags", () => {
        const feature = parseFeatureFile("./test/resources/features/taggedServer.feature").feature;
        expectToExist(feature);
        const issueMapping = issuesByScenario(feature, CONTEXT.config.jira.projectKey);
        expect(issueMapping).to.have.key("A tagged scenario");
        expect(issueMapping["A tagged scenario"]).to.eq("CYP-103");
    });

    it("should be able to extract Xray cloud tags", () => {
        const feature = parseFeatureFile("./test/resources/features/taggedCloud.feature").feature;
        expectToExist(feature);
        const issueMapping = issuesByScenario(feature, CONTEXT.config.jira.projectKey);
        expect(issueMapping).to.have.key("A tagged scenario");
        expect(issueMapping["A tagged scenario"]).to.eq("CYP-857");
    });

    it("should be able to skip unrelated tags", () => {
        const feature = parseFeatureFile(
            "./test/resources/features/taggedServerUnrelated.feature"
        ).feature;
        const stubbedInfo = stubLogInfo();
        const issueMapping = issuesByScenario(feature, CONTEXT.config.jira.projectKey);
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
        const stubbedError = stubLogError();
        const issueMapping = issuesByScenario(feature, CONTEXT.config.jira.projectKey);
        expect(issueMapping).to.be.empty;
        expect(stubbedError).to.have.been.called.with.callCount(1);
        expect(stubbedError).to.have.been.calledWith(
            'Multiple issue keys found in tags of scenario "A tagged scenario": CYP-123, CYP-456, CYP-789'
        );
    });
});
