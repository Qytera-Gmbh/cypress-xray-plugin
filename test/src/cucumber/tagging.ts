/// <reference types="cypress" />

import { expect } from "chai";
import { CONTEXT, initContext } from "../../../src/context";
import { issuesByScenario } from "../../../src/cucumber/tagging";
import { parseFeatureFile } from "../../../src/util/parsing";
import { DummyClient, expectToExist } from "../helpers";

describe("the cucumber tag extractor", () => {
    beforeEach(() => {
        initContext({
            jira: {
                projectKey: "CYP",
            },
        });
        CONTEXT.client = new DummyClient();
    });

    it("should be able to extract Xray server tags", async () => {
        const feature = parseFeatureFile(
            "./test/resources/features/taggedServer.feature"
        ).feature;
        expectToExist(feature);
        const issueMapping = issuesByScenario(
            feature,
            CONTEXT.config.jira.projectKey
        );
        expect(issueMapping).to.have.key("A tagged scenario");
        expect(issueMapping["A tagged scenario"]).to.eq("CYP-103");
    });

    it("should be able to extract Xray cloud tags", async () => {
        const feature = parseFeatureFile(
            "./test/resources/features/taggedCloud.feature"
        ).feature;
        expectToExist(feature);
        const issueMapping = issuesByScenario(
            feature,
            CONTEXT.config.jira.projectKey
        );
        expect(issueMapping).to.have.key("A tagged scenario");
        expect(issueMapping["A tagged scenario"]).to.eq("CYP-857");
    });
});
