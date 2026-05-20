import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getXrayStatus } from "./cucumber-status";

void describe(relative(cwd(), __filename), () => {
    void describe(getXrayStatus.name, () => {
        void it("uses passed as default status name for passed tests", () => {
            assert.strictEqual(getXrayStatus("passed"), "passed");
        });
        void it("uses failed as default status name for failed tests", () => {
            assert.strictEqual(getXrayStatus("failed"), "failed");
        });
        void it("uses pending as default status name for pending tests", () => {
            assert.strictEqual(getXrayStatus("pending"), "pending");
        });
        void it("uses skipped as default status name for skipped tests", () => {
            assert.strictEqual(getXrayStatus("skipped"), "skipped");
        });
        void it("uses unknown as default status name for unknown tests", () => {
            assert.strictEqual(getXrayStatus("unknown"), "unknown");
        });
        void it("uses undefined as default status name for undefined tests", () => {
            assert.strictEqual(getXrayStatus("undefined"), "undefined");
        });
        void it("prefers custom passed statuses", () => {
            assert.strictEqual(
                getXrayStatus("passed", {
                    passed: "OK",
                }),
                "OK"
            );
        });
        void it("prefers custom failed statuses", () => {
            assert.strictEqual(
                getXrayStatus("failed", {
                    failed: "NO",
                }),
                "NO"
            );
        });
        void it("prefers custom pending statuses", () => {
            assert.strictEqual(
                getXrayStatus("pending", {
                    pending: "WIP",
                }),
                "WIP"
            );
        });
        void it("prefers custom skipped statuses", () => {
            assert.strictEqual(
                getXrayStatus("skipped", {
                    skipped: "SKIP",
                }),
                "SKIP"
            );
        });
        void it("does not modify unknown statuses", () => {
            assert.strictEqual(
                getXrayStatus("unknown", {
                    failed: "FAILING",
                    passed: "PASSING",
                    pending: "PENDING",
                    skipped: "SKIPPING",
                }),
                "unknown"
            );
        });
        void it("does not modify undefined statuses", () => {
            assert.strictEqual(
                getXrayStatus("undefined", {
                    failed: "FAILING",
                    passed: "PASSING",
                    pending: "PENDING",
                    skipped: "SKIPPING",
                }),
                "undefined"
            );
        });
        void it("throws for unexpected statuses", () => {
            assert.throws(() => getXrayStatus("abc bla bla"), {
                message: "Unknown status: abc bla bla",
            });
        });
    });
});
