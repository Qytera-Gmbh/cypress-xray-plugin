import { expect } from "chai";
import { readFileSync } from "fs";
import { initOptions } from "../../context";
import { CypressRunResult } from "../../types/cypress/12.0.0/api";
import { InternalOptions } from "../../types/plugin";
import { TestIssueData } from "./importExecutionConverter";
import { TestConverterCloud } from "./testConverterCloud";

describe("the test converter cloud", () => {
    let options: InternalOptions;
    let testIssueData: TestIssueData;
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
        testIssueData = { summaries: {}, testTypes: {} };
    });

    it("converts run results for Cypress <13.0.0", async () => {
        const result: CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        testIssueData.summaries = {
            "CYP-40": "This is",
            "CYP-41": "a distributed",
            "CYP-49": "summary",
        };
        testIssueData.testTypes = {
            "CYP-40": "Generic",
            "CYP-41": "Manual",
            "CYP-49": "Cucumber",
        };
        const converter = new TestConverterCloud(options);
        const json = await converter.convert(result, testIssueData);
        expect(json).to.deep.eq([
            {
                testKey: "CYP-40",
                testInfo: {
                    projectKey: "CYP",
                    summary: "This is",
                    type: "Generic",
                },
                start: "2022-11-28T17:41:15Z",
                finish: "2022-11-28T17:41:15Z",
                status: "PASSED",
            },
            {
                testKey: "CYP-41",
                testInfo: {
                    projectKey: "CYP",
                    summary: "a distributed",
                    type: "Manual",
                },
                start: "2022-11-28T17:41:15Z",
                finish: "2022-11-28T17:41:15Z",
                status: "PASSED",
            },
            {
                testKey: "CYP-49",
                testInfo: {
                    projectKey: "CYP",
                    summary: "summary",
                    type: "Cucumber",
                },
                start: "2022-11-28T17:41:15Z",
                finish: "2022-11-28T17:41:19Z",
                status: "FAILED",
                evidence: [
                    {
                        filename: "small.png",
                        data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                    },
                ],
            },
        ]);
    });

    it("converts run results for Cypress =13.0.0", async () => {
        const result: CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
        );
        testIssueData.summaries = {
            "CYP-452": "This is",
            "CYP-268": "a distributed",
            "CYP-237": "summary",
            "CYP-332": "part 4",
            "CYP-333": "part 5",
        };
        testIssueData.testTypes = {
            "CYP-452": "Generic",
            "CYP-268": "Manual",
            "CYP-237": "Cucumber",
            "CYP-332": "Manual",
            "CYP-333": "Manual",
        };
        const converter = new TestConverterCloud(options);
        const json = await converter.convert(result, testIssueData);
        expect(json).to.deep.eq([
            {
                testKey: "CYP-452",
                testInfo: {
                    projectKey: "CYP",
                    summary: "This is",
                    type: "Generic",
                },
                start: "2023-09-09T10:59:28Z",
                finish: "2023-09-09T10:59:29Z",
                status: "PASSED",
            },
            {
                testKey: "CYP-268",
                testInfo: {
                    projectKey: "CYP",
                    summary: "a distributed",
                    type: "Manual",
                },
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "PASSED",
            },
            {
                testKey: "CYP-237",
                testInfo: {
                    projectKey: "CYP",
                    summary: "summary",
                    type: "Cucumber",
                },
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "FAILED",
                evidence: [
                    {
                        filename: "small CYP-237.png",
                        data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                    },
                ],
            },
            {
                testKey: "CYP-332",
                testInfo: {
                    projectKey: "CYP",
                    summary: "part 4",
                    type: "Manual",
                },
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "FAILED",
            },
            {
                testKey: "CYP-333",
                testInfo: {
                    projectKey: "CYP",
                    summary: "part 5",
                    type: "Manual",
                },
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "TODO",
            },
        ]);
    });
});
