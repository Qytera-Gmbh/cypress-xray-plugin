import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { getXrayStatus } from "./status.js";

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
    await describe(getXrayStatus.name, async () => {
        await it("uses passed as default status name for passed tests", () => {
            expect(getXrayStatus("passed")).to.eq("passed");
        });
        await it("uses failed as default status name for failed tests", () => {
            expect(getXrayStatus("failed")).to.eq("failed");
        });
        await it("uses pending as default status name for pending tests", () => {
            expect(getXrayStatus("pending")).to.eq("pending");
        });
        await it("uses skipped as default status name for skipped tests", () => {
            expect(getXrayStatus("skipped")).to.eq("skipped");
        });
        await it("uses unknown as default status name for unknown tests", () => {
            expect(getXrayStatus("unknown")).to.eq("unknown");
        });
        await it("uses undefined as default status name for undefined tests", () => {
            expect(getXrayStatus("undefined")).to.eq("undefined");
        });
        await it("prefers custom passed statuses", () => {
            expect(
                getXrayStatus("passed", {
                    passed: "OK",
                })
            ).to.eq("OK");
        });
        await it("prefers custom failed statuses", () => {
            expect(
                getXrayStatus("failed", {
                    failed: "NO",
                })
            ).to.eq("NO");
        });
        await it("prefers custom pending statuses", () => {
            expect(
                getXrayStatus("pending", {
                    pending: "WIP",
                })
            ).to.eq("WIP");
        });
        await it("prefers custom skipped statuses", () => {
            expect(
                getXrayStatus("skipped", {
                    skipped: "SKIP",
                })
            ).to.eq("SKIP");
        });
        await it("does not modify unknown statuses", () => {
            expect(
                getXrayStatus("unknown", {
                    failed: "FAILING",
                    passed: "PASSING",
                    pending: "PENDING",
                    skipped: "SKIPPING",
                })
            ).to.eq("unknown");
        });
        await it("does not modify undefined statuses", () => {
            expect(
                getXrayStatus("undefined", {
                    failed: "FAILING",
                    passed: "PASSING",
                    pending: "PENDING",
                    skipped: "SKIPPING",
                })
            ).to.eq("undefined");
        });
        await it("throws for unexpected statuses", () => {
            expect(() => getXrayStatus("abc bla bla")).to.throw("Unknown status: abc bla bla");
        });
    });
});
