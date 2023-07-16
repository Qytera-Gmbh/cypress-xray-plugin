import { expect } from "chai";
import { readFileSync } from "fs";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { ImportExecutionConverterServer } from "./importExecutionConverterServer";
describe("the import execution results converter (server)", () => {
    let options: InternalOptions;

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
    });

    it("should use PASS as default status name for passed tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterServer(options);
        const json = converter.convert(result);
        expect(json.tests[0].status).to.eq("PASS");
        expect(json.tests[1].status).to.eq("PASS");
    });

    it("should use FAIL as default status name for failed tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterServer(options);
        const json = converter.convert(result);
        expect(json.tests[2].status).to.eq("FAIL");
    });

    it("should use TODO as default status name for pending tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultPending.json", "utf-8")
        );
        const converter = new ImportExecutionConverterServer(options);
        const json = converter.convert(result);
        expect(json.tests[0].status).to.eq("TODO");
        expect(json.tests[1].status).to.eq("TODO");
        expect(json.tests[2].status).to.eq("TODO");
        expect(json.tests[3].status).to.eq("TODO");
    });

    it("should use FAIL as default status name for skipped tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultSkipped.json", "utf-8")
        );
        const converter = new ImportExecutionConverterServer(options);
        const json = converter.convert(result);
        expect(json.tests[0].status).to.eq("FAIL");
        expect(json.tests[1].status).to.eq("FAIL");
    });
});
