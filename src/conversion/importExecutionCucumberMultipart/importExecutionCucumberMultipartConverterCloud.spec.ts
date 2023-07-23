/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ConversionParameters } from "./importExecutionCucumberMultipartConverter";
import { ImportExecutionCucumberMultipartConverterCloud } from "./importExecutionCucumberMultipartConverterCloud";

describe("the import execution cucumber multipart cloud converter", () => {
    let options: InternalOptions;
    let converter: ImportExecutionCucumberMultipartConverterCloud;
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
        converter = new ImportExecutionCucumberMultipartConverterCloud(options);
    });

    it("should add test plan issue keys", () => {
        const result: CucumberMultipartFeature[] = JSON.parse(
            readFileSync(
                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                "utf-8"
            )
        );
        options.jira.testPlanIssueKey = "CYP-123";
        const multipart = converter.convert([result[0]], parameters);
        expect(multipart.info.xrayFields.testPlanKey).to.eq("CYP-123");
    });
});
