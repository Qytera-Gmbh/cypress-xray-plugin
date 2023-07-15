/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/util";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ImportExecutionCucumberMultipartConverterServer } from "./importExecutionCucumberMultipartConverterServer";

describe("the import execution cucumber multipart server converter", () => {
    let options: InternalOptions;
    let converter: ImportExecutionCucumberMultipartConverterServer;
    const result: CucumberMultipartFeature[] = JSON.parse(
        readFileSync(
            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
            "utf-8"
        )
    );
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
        converter = new ImportExecutionCucumberMultipartConverterServer(
            options,
            "2023-07-11T17:53:35.463Z"
        );
    });

    it("should log warnings when unable to create test issues", () => {
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
        options.jira.testPlanIssueKey = "CYP-123";
        options.jira.testPlanIssueDetails = {
            id: "customfield_12126",
            subtask: false,
        };
        const multipart = converter.convert(result);
        expect(multipart.info.fields["customfield_12126"]).to.deep.eq(["CYP-123"]);
    });
});
