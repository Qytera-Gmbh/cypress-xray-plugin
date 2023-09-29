import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/util";
import {
    initCucumberOptions,
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../context";
import { CypressRunResult as CypressRunResult_V12 } from "../../types/cypress/12.0.0/api";
import { CypressRunResult as CypressRunResult_V13 } from "../../types/cypress/13.0.0/api";
import { InternalOptions } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { TestIssueData } from "./importExecutionConverter";
import { TestConverterCloud } from "./testConverterCloud";

chai.use(chaiAsPromised);

describe("the test converter", () => {
    let options: InternalOptions;
    let testIssueData: TestIssueData;
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
        testIssueData = { summaries: {}, testTypes: {} };
    });

    it("warns about skipped screenshots", async () => {
        const result: CypressRunResult_V13 = JSON.parse(
            readFileSync("./test/resources/runResult_13_0_0_manualScreenshot.json", "utf-8")
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
        const { stubbedWarning } = stubLogging();
        const json = await converter.convert(result, testIssueData);
        expect(stubbedWarning).to.have.been.calledOnceWithExactly(
            dedent(`
                Screenshot will not be uploaded: ./test/resources/small.png

                Its filename does not contain a test issue key.
                To upload screenshots, include a test issue key anywhere in their names:

                cy.screenshot("CYP-123 small")
            `)
        );
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
        const converter = new TestConverterCloud(options);
        await expect(converter.convert(result, testIssueData)).to.eventually.be.rejectedWith(
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
        const converter = new TestConverterCloud(options);
        await expect(converter.convert(result, testIssueData)).to.eventually.be.rejectedWith(
            "Failed to extract test run data: Only Cucumber tests were executed"
        );
    });
});
