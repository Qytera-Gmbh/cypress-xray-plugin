import { expect } from "chai";
import path from "node:path";
import { CypressStatus } from "../../../../../../types/cypress/status";
import { getXrayStatus, toCypressStatus } from "./status";

describe(path.relative(process.cwd(), __filename), () => {
    describe(toCypressStatus.name, () => {
        it("parses passed statuses", () => {
            expect(toCypressStatus("passed")).to.eq(CypressStatus.PASSED);
        });
        it("parses failed statuses", () => {
            expect(toCypressStatus("failed")).to.eq(CypressStatus.FAILED);
        });
        it("parses pending statuses", () => {
            expect(toCypressStatus("pending")).to.eq(CypressStatus.PENDING);
        });
        it("parses skipped statuses", () => {
            expect(toCypressStatus("skipped")).to.eq(CypressStatus.SKIPPED);
        });
        it("throws for unknown statuses", () => {
            expect(() => toCypressStatus("5")).to.throw("Unknown Cypress test status: 5");
        });
    });

    describe(getXrayStatus.name, () => {
        describe("server", () => {
            it("uses PASS as default status name for passed tests", () => {
                expect(getXrayStatus(CypressStatus.PASSED, false)).to.eq("PASS");
            });
            it("uses FAIL as default status name for failed tests", () => {
                expect(getXrayStatus(CypressStatus.FAILED, false)).to.eq("FAIL");
            });
            it("uses TODO as default status name for pending tests", () => {
                expect(getXrayStatus(CypressStatus.PENDING, false)).to.eq("TODO");
            });
            it("uses FAIL as default status name for skipped tests", () => {
                expect(getXrayStatus(CypressStatus.SKIPPED, false)).to.eq("FAIL");
            });
        });
        describe("cloud", () => {
            it("uses PASSED as default status name for passed tests", () => {
                expect(getXrayStatus(CypressStatus.PASSED, true)).to.eq("PASSED");
            });
            it("uses FAILED as default status name for failed tests", () => {
                expect(getXrayStatus(CypressStatus.FAILED, true)).to.eq("FAILED");
            });
            it("uses TO DO as default status name for pending tests", () => {
                expect(getXrayStatus(CypressStatus.PENDING, true)).to.eq("TO DO");
            });
            it("uses FAILED as default status name for skipped tests", () => {
                expect(getXrayStatus(CypressStatus.SKIPPED, true)).to.eq("FAILED");
            });
        });
        it("prefers custom passed statuses", () => {
            expect(
                getXrayStatus(CypressStatus.PASSED, true, {
                    passed: "OK",
                })
            ).to.eq("OK");
        });
        it("prefers custom failed statuses", () => {
            expect(
                getXrayStatus(CypressStatus.FAILED, true, {
                    failed: "NO",
                })
            ).to.eq("NO");
        });
        it("prefers custom pending statuses", () => {
            expect(
                getXrayStatus(CypressStatus.PENDING, true, {
                    pending: "WIP",
                })
            ).to.eq("WIP");
        });
        it("prefers custom skipped statuses", () => {
            expect(
                getXrayStatus(CypressStatus.SKIPPED, true, {
                    skipped: "SKIP",
                })
            ).to.eq("SKIP");
        });
        it("throws for unknown statuses", () => {
            expect(() => getXrayStatus("hello", false)).to.throw("Unknown status: hello");
        });
    });
});
