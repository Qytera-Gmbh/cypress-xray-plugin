/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { toXrayJSON } from "../../../src/conversion/conversion";
import { XrayExecutionResults } from "../../../src/types/xray/xray";
import { expectToExist } from "../helpers";

describe("the conversion function", () => {
    it("should be able to convert test results into Xray JSON", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./tests/resources/runResult.json", "utf-8")
        );
        const json: XrayExecutionResults = toXrayJSON(result);
        expect(json.tests).to.have.length(3);
    });

    it("should be able to erase milliseconds from timestamps", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./tests/resources/runResult.json", "utf-8")
        );
        const json: XrayExecutionResults = toXrayJSON(result);
        expect(json.info?.startDate).to.eq("2022-11-28T17:41:12Z");
        expect(json.info?.finishDate).to.eq("2022-11-28T17:41:19Z");
    });

    it("should be able to detect re-use of existing test issues", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync(
                "./tests/resources/runResultExistingTestIssues.json",
                "utf-8"
            )
        );
        const json: XrayExecutionResults = toXrayJSON(result);
        expectToExist(json.tests);
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].testKey).to.eq("CYP-40");
        expect(json.tests[1].testKey).to.eq("CYP-41");
        expect(json.tests[2].testKey).to.eq("CYP-42");
    });

    it("should not be able to deal with multiple existing test issues", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync(
                "./tests/resources/runResultExistingTestIssuesError.json",
                "utf-8"
            )
        );
        const title = "CYP-123 should throw an error CYP-456";
        const matches = "CYP-123,CYP-456";
        expect(() => {
            toXrayJSON(result);
        }).to.throw(
            `Multiple test keys found in test case title "${title}": ${matches}`
        );
    });
});
