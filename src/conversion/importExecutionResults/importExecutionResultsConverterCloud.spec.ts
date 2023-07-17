import { expect } from "chai";
import { readFileSync } from "fs";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { ImportExecutionResultsConverterCloud } from "./importExecutionResultsConverterCloud";

describe("the import execution results converter (cloud)", () => {
    let options: InternalOptions;
    let converter: ImportExecutionResultsConverterCloud;
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
        converter = new ImportExecutionResultsConverterCloud(options);
    });

    it("should use PASSED as default status name for passed tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("PASSED");
        expect(json.tests[1].status).to.eq("PASSED");
    });

    it("should use FAILED as default status name for failed tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expect(json.tests[2].status).to.eq("FAILED");
    });

    it("should use TODO as default status name for pending tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultPending.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("TODO");
        expect(json.tests[1].status).to.eq("TODO");
        expect(json.tests[2].status).to.eq("TODO");
        expect(json.tests[3].status).to.eq("TODO");
    });

    it("should use FAILED as default status name for skipped tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultSkipped.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("FAILED");
        expect(json.tests[1].status).to.eq("FAILED");
    });
});
