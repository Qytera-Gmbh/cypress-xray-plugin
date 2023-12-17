import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import { getMockedLogger } from "../../../test/mocks";
import {
    initCucumberOptions,
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../context";
import { Level } from "../../logging/logging";
import { CypressRunResult as CypressRunResult_V12 } from "../../types/cypress/12.0.0/api";
import { CypressRunResult as CypressRunResult_V13 } from "../../types/cypress/13.0.0/api";
import { InternalOptions } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { TestConverter } from "./testConverter";

chai.use(chaiAsPromised);

describe("the test converter", () => {
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

    it("warns about skipped screenshots", async () => {
        const result: CypressRunResult_V13 = JSON.parse(
            readFileSync("./test/resources/runResult_13_0_0_manualScreenshot.json", "utf-8")
        );
        const converter = new TestConverter(options, false);
        const logger = getMockedLogger();
        logger.message
            .withArgs(
                Level.WARNING,
                dedent(`
                    Screenshot will not be uploaded: ./test/resources/small.png

                    Its filename does not contain a test issue key.
                    To upload screenshots, include a test issue key anywhere in their names:

                    cy.screenshot("CYP-123 small")
                `)
            )
            .onFirstCall()
            .returns();
        const json = await converter.toXrayTests(result);
        expect(json[0].evidence).to.be.undefined;
        expect(json[1].evidence).to.be.undefined;
        expect(json[2].evidence).to.be.undefined;
        expect(json[3].evidence).to.be.undefined;
        expect(json[4].evidence).to.be.undefined;
    });

    it("throws if the run results only contain Cucumber tests <13.0.0", async () => {
        const result: CypressRunResult_V12 = JSON.parse(
            readFileSync("./test/resources/runResultCucumber.json", "utf-8")
        );
        options.cucumber = await initCucumberOptions(
            {
                testingType: "e2e",
                projectRoot: "",
                reporter: "",
                specPattern: "",
                excludeSpecPattern: "",
                env: { jsonEnabled: true, jsonOutput: "somewhere" },
            },
            { featureFileExtension: ".feature" }
        );
        const converter = new TestConverter(options, true);
        await expect(converter.toXrayTests(result)).to.eventually.be.rejectedWith(
            "Failed to extract test run data: Only Cucumber tests were executed"
        );
    });

    it("throws if the run results only contain Cucumber tests =13.0.0", async () => {
        const result: CypressRunResult_V13 = JSON.parse(
            readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
        );
        options.cucumber = await initCucumberOptions(
            {
                testingType: "e2e",
                projectRoot: "",
                reporter: "",
                specPattern: "",
                excludeSpecPattern: "",
                env: { jsonEnabled: true, jsonOutput: "somewhere" },
            },
            { featureFileExtension: ".ts" }
        );
        const converter = new TestConverter(options, false);
        await expect(converter.toXrayTests(result)).to.eventually.be.rejectedWith(
            "Failed to extract test run data: Only Cucumber tests were executed"
        );
    });

    it("converts server run results for Cypress <13.0.0", async () => {
        const result: CypressRunResult_V12 = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        const converter = new TestConverter(options, false);
        const json = await converter.toXrayTests(result);
        expect(json).to.deep.eq([
            {
                testKey: "CYP-40",
                start: "2022-11-28T17:41:15Z",
                finish: "2022-11-28T17:41:15Z",
                status: "PASS",
            },
            {
                testKey: "CYP-41",
                start: "2022-11-28T17:41:15Z",
                finish: "2022-11-28T17:41:15Z",
                status: "PASS",
            },
            {
                testKey: "CYP-49",
                start: "2022-11-28T17:41:15Z",
                finish: "2022-11-28T17:41:19Z",
                status: "FAIL",
                evidence: [
                    {
                        filename: "small.png",
                        data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                    },
                ],
            },
        ]);
    });

    it("converts server run results for Cypress =13.0.0", async () => {
        const result: CypressRunResult_V13 = JSON.parse(
            readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
        );
        const converter = new TestConverter(options, false);
        const json = await converter.toXrayTests(result);
        expect(json).to.deep.eq([
            {
                testKey: "CYP-452",
                start: "2023-09-09T10:59:28Z",
                finish: "2023-09-09T10:59:29Z",
                status: "PASS",
            },
            {
                testKey: "CYP-268",
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "PASS",
            },
            {
                testKey: "CYP-237",
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "FAIL",
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
                status: "FAIL",
            },
            {
                testKey: "CYP-333",
                start: "2023-09-09T10:59:29Z",
                finish: "2023-09-09T10:59:29Z",
                status: "TODO",
            },
        ]);
    });

    it("converts cloud run results for Cypress <13.0.0", async () => {
        const result: CypressRunResult_V12 = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        const converter = new TestConverter(options, true);
        const json = await converter.toXrayTests(result);
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

    it("converts cloud run results for Cypress =13.0.0", async () => {
        const result: CypressRunResult_V13 = JSON.parse(
            readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
        );
        const converter = new TestConverter(options, true);
        const json = await converter.toXrayTests(result);
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
