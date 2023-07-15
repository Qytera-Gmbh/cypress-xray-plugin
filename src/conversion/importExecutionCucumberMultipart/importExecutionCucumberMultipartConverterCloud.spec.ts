/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/util";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ImportExecutionCucumberMultipartConverterCloud } from "./importExecutionCucumberMultipartConverterCloud";

describe("the import execution cucumber multipart cloud converter", () => {
    let options: InternalOptions;
    let converter: ImportExecutionCucumberMultipartConverterCloud;

    beforeEach(() => {
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
                xray: {
                    testType: "Manual",
                    uploadResults: true,
                },
                cucumber: {
                    featureFileExtension: ".feature",
                },
            }
        );
        converter = new ImportExecutionCucumberMultipartConverterCloud(
            options,
            "2023-07-11T17:53:35.463Z"
        );
    });

    it("should log warnings when unable to create test issues", () => {
        const result: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
        options.jira.createTestIssues = false;
        const { stubbedWarning } = stubLogging();
        const multipart = converter.convert(result);
        expect(multipart.features).to.be.an("array").with.length(1);
        expect(multipart.features[0].elements).to.be.an("array").with.length(3);
        expect(stubbedWarning).to.have.been.called.with.callCount(1);
        expect(stubbedWarning).to.have.been.calledWith(
            "No test issue key found in scenario tags and the plugin is not allowed to create new test issues. Skipping result upload for scenario: TC - Development"
        );
    });

    it("should be able to add test plan issue keys", () => {
        const result: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
        options.jira.testPlanIssueKey = "CYP-123";
        const multipart = converter.convert(result);
        expect(multipart.info.xrayFields.testPlanKey).to.eq("CYP-123");
    });
});
