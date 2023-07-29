/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { stub } from "sinon";
import { initOptions } from "../../context";
import { JiraRepositoryServer } from "../../repository/jira/jiraRepositoryServer";
import { InternalOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ConversionParameters } from "./importExecutionCucumberMultipartConverter";
import { ImportExecutionCucumberMultipartConverterServer } from "./importExecutionCucumberMultipartConverterServer";

describe("the import execution cucumber multipart server converter", () => {
    let options: InternalOptions;
    let converter: ImportExecutionCucumberMultipartConverterServer;
    let jiraRepository: JiraRepositoryServer;
    const result: CucumberMultipartFeature[] = JSON.parse(
        readFileSync(
            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
            "utf-8"
        )
    );
    const parameters: ConversionParameters = JSON.parse(
        readFileSync("./test/resources/runResult.json", "utf-8")
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
                    uploadResults: true,
                },
                cucumber: {
                    featureFileExtension: ".feature",
                },
            }
        );
        jiraRepository = new JiraRepositoryServer(null, null, options);
        converter = new ImportExecutionCucumberMultipartConverterServer(options, jiraRepository);
    });

    it("should be able to add test plan issue keys", async () => {
        stub(jiraRepository, "getFieldId").withArgs("Test Plan").resolves("customfield_12126");
        options.jira.testPlanIssueKey = "CYP-123";
        const multipart = await converter.convert([result[0]], parameters);
        expect(multipart.info.fields["customfield_12126"]).to.deep.eq(["CYP-123"]);
    });
});
