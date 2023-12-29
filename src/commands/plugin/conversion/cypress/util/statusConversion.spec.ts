import { expect } from "chai";
import { Status } from "../../../../../types/testStatus";
import { getXrayStatus, toCypressStatus } from "./statusConversion";

describe("toCypressStatus", () => {
    it("parses passed statuses", () => {
        expect(toCypressStatus("passed")).to.eq(Status.PASSED);
    });
    it("parses failed statuses", () => {
        expect(toCypressStatus("failed")).to.eq(Status.FAILED);
    });
    it("parses pending statuses", () => {
        expect(toCypressStatus("pending")).to.eq(Status.PENDING);
    });
    it("parses skipped statuses", () => {
        expect(toCypressStatus("skipped")).to.eq(Status.SKIPPED);
    });
    it("throws for unknown statuses", () => {
        expect(() => toCypressStatus("5")).to.throw("Unknown Cypress test status: 5");
    });
});

describe("getXrayStatus", () => {
    describe("server", () => {
        it("uses PASS as default status name for passed tests", () => {
            expect(getXrayStatus(Status.PASSED, false)).to.eq("PASS");
        });
        it("uses FAIL as default status name for failed tests", () => {
            expect(getXrayStatus(Status.FAILED, false)).to.eq("FAIL");
        });
        it("uses TODO as default status name for pending tests", () => {
            expect(getXrayStatus(Status.PENDING, false)).to.eq("TODO");
        });
        it("uses FAIL as default status name for skipped tests", () => {
            expect(getXrayStatus(Status.SKIPPED, false)).to.eq("FAIL");
        });
    });
    describe("cloud", () => {
        it("uses PASSED as default status name for passed tests", () => {
            expect(getXrayStatus(Status.PASSED, true)).to.eq("PASSED");
        });
        it("uses FAILED as default status name for failed tests", () => {
            expect(getXrayStatus(Status.FAILED, true)).to.eq("FAILED");
        });
        it("uses TODO as default status name for pending tests", () => {
            expect(getXrayStatus(Status.PENDING, true)).to.eq("TODO");
        });
        it("uses FAILED as default status name for skipped tests", () => {
            expect(getXrayStatus(Status.SKIPPED, true)).to.eq("FAILED");
        });
    });
    it("prefers custom passed statuses", () => {
        expect(
            getXrayStatus(Status.PASSED, true, {
                passed: "OK",
            })
        ).to.eq("OK");
    });
    it("prefers custom failed statuses", () => {
        expect(
            getXrayStatus(Status.FAILED, true, {
                failed: "NO",
            })
        ).to.eq("NO");
    });
    it("prefers custom pending statuses", () => {
        expect(
            getXrayStatus(Status.PENDING, true, {
                pending: "WIP",
            })
        ).to.eq("WIP");
    });
    it("prefers custom skipped statuses", () => {
        expect(
            getXrayStatus(Status.SKIPPED, true, {
                skipped: "SKIP",
            })
        ).to.eq("SKIP");
    });
});
