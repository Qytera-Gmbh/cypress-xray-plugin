/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { toXrayJSON } from "../../../src/conversion/conversion";
import { XrayExecutionResults } from "../../../src/types/xray/xray";

describe("the conversion function", () => {
    let result: CypressCommandLine.CypressRunResult;

    before(() => {
        result = JSON.parse(
            readFileSync("./tests/resources/runResult.json", "utf-8")
        );
    });

    it("should be able to convert test results into Xray JSON", () => {
        const json: XrayExecutionResults = toXrayJSON(result);
        expect(json.info?.startDate).to.eq("2022-11-28T17:41:12.234Z");
        expect(json.info?.finishDate).to.eq("2022-11-28T17:41:19.974Z");
        expect(json.tests).to.have.length(3);
    });
});
