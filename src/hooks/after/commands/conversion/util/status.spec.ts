import { expect } from "chai";
import path from "path";
import { getXrayStatus } from "./status";

describe(path.relative(process.cwd(), __filename), () => {
    describe(getXrayStatus.name, () => {
        it("uses passed as default status name for passed tests", () => {
            expect(getXrayStatus("passed")).to.eq("passed");
        });
        it("uses failed as default status name for failed tests", () => {
            expect(getXrayStatus("failed")).to.eq("failed");
        });
        it("uses pending as default status name for pending tests", () => {
            expect(getXrayStatus("pending")).to.eq("pending");
        });
        it("uses skipped as default status name for skipped tests", () => {
            expect(getXrayStatus("skipped")).to.eq("skipped");
        });
        it("uses unknown as default status name for unknown tests", () => {
            expect(getXrayStatus("unknown")).to.eq("unknown");
        });
        it("uses undefined as default status name for undefined tests", () => {
            expect(getXrayStatus("undefined")).to.eq("undefined");
        });
        it("prefers custom passed statuses", () => {
            expect(
                getXrayStatus("passed", {
                    passed: "OK",
                })
            ).to.eq("OK");
        });
        it("prefers custom failed statuses", () => {
            expect(
                getXrayStatus("failed", {
                    failed: "NO",
                })
            ).to.eq("NO");
        });
        it("prefers custom pending statuses", () => {
            expect(
                getXrayStatus("pending", {
                    pending: "WIP",
                })
            ).to.eq("WIP");
        });
        it("prefers custom skipped statuses", () => {
            expect(
                getXrayStatus("skipped", {
                    skipped: "SKIP",
                })
            ).to.eq("SKIP");
        });
        it("does not modify unknown statuses", () => {
            expect(
                getXrayStatus("unknown", {
                    failed: "FAILING",
                    passed: "PASSING",
                    pending: "PENDING",
                    skipped: "SKIPPING",
                })
            ).to.eq("unknown");
        });
        it("does not modify undefined statuses", () => {
            expect(
                getXrayStatus("undefined", {
                    failed: "FAILING",
                    passed: "PASSING",
                    pending: "PENDING",
                    skipped: "SKIPPING",
                })
            ).to.eq("undefined");
        });
        it("throws for unexpected statuses", () => {
            expect(() => getXrayStatus("abc bla bla")).to.throw("Unknown status: abc bla bla");
        });
    });
});
