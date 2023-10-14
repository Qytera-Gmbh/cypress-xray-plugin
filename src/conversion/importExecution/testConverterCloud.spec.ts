import { expect } from "chai";
import { readFileSync } from "fs";
import {
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../context";
import { CypressRunResult } from "../../types/cypress/12.0.0/api";
import { InternalOptions } from "../../types/plugin";
import { TestConverterCloud } from "./testConverterCloud";

describe("the test converter cloud", () => {
    let options: InternalOptions;
    beforeEach(() => {
        options = {
            jira: initJiraOptions(
                {},
                {
                    projectKey: "CYP",
                    url: "https://example.org",
                }
            ),
            xray: initXrayOptions(
                {},
                {
                    uploadResults: true,
                }
            ),
            plugin: initPluginOptions({}, {}),
            openSSL: initOpenSSLOptions({}, {}),
        };
    });

    it("converts run results for Cypress <13.0.0", async () => {
        const result: CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        const converter = new TestConverterCloud(options);
        const json = await converter.convert(result);
        expect(json).to.deep.eq([
            {
                testKey: "CYP-40",
                start: "2022-11-28T17:41:15Z",
                finish: "2022-11-28T17:41:15Z",
                status: "PASSED",
            },
            {
                testKey: "CYP-41",
                start: "2022-11-28T17:41:15Z",
                finish: "2022-11-28T17:41:15Z",
                status: "PASSED",
            },
            {
                testKey: "CYP-49",
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
        const converter = new TestConverterCloud(options);
        const json = await converter.convert(result);
        expect(json).to.deep.eq([
            {
                testKey: "CYP-452",
                start: "2023-09-09T10:59:28Z",
                finish: "2023-09-09T10:59:29Z",
                status: "PASSED",
            },
            {
                testKey: "CYP-268",
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "PASSED",
            },
            {
                testKey: "CYP-237",
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
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "FAILED",
            },
            {
                testKey: "CYP-333",
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "TODO",
            },
        ]);
    });
});
