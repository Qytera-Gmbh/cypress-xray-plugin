import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getXrayStatus } from "./status";

describe(relative(cwd(), __filename), async () => {
    await describe(getXrayStatus.name, async () => {
        await it("uses passed as default status name for passed tests", () => {
            assert.strictEqual(getXrayStatus("passed"), "passed");
        });
        await it("uses failed as default status name for failed tests", () => {
            assert.strictEqual(getXrayStatus("failed"), "failed");
        });
        await it("uses pending as default status name for pending tests", () => {
            assert.strictEqual(getXrayStatus("pending"), "pending");
        });
        await it("uses skipped as default status name for skipped tests", () => {
            assert.strictEqual(getXrayStatus("skipped"), "skipped");
        });
        await it("uses unknown as default status name for unknown tests", () => {
            assert.strictEqual(getXrayStatus("unknown"), "unknown");
        });
        await it("uses undefined as default status name for undefined tests", () => {
            assert.strictEqual(getXrayStatus("undefined"), "undefined");
        });
        await it("prefers custom passed statuses", () => {
            assert.strictEqual(
                getXrayStatus("passed", {
                    passed: "OK",
                }),
                "OK"
            );
        });
        await it("prefers custom failed statuses", () => {
            assert.strictEqual(
                getXrayStatus("failed", {
                    failed: "NO",
                }),
                "NO"
            );
        });
        await it("prefers custom pending statuses", () => {
            assert.strictEqual(
                getXrayStatus("pending", {
                    pending: "WIP",
                }),
                "WIP"
            );
        });
        await it("prefers custom skipped statuses", () => {
            assert.strictEqual(
                getXrayStatus("skipped", {
                    skipped: "SKIP",
                }),
                "SKIP"
            );
        });
        await it("does not modify unknown statuses", () => {
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
        await it("does not modify undefined statuses", () => {
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
        await it("throws for unexpected statuses", () => {
            assert.throws(() => getXrayStatus("abc bla bla"), {
                message: "Unknown status: abc bla bla",
            });
        });
    });
});
