import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { CypressStatus } from "../../../../../../types/cypress/status";
import { getXrayStatus, toCypressStatus } from "./status";

describe(relative(cwd(), __filename), async () => {
    await describe(toCypressStatus.name, async () => {
        await it("parses passed statuses", () => {
            assert.strictEqual(toCypressStatus("passed"), CypressStatus.PASSED);
        });
        await it("parses failed statuses", () => {
            assert.strictEqual(toCypressStatus("failed"), CypressStatus.FAILED);
        });
        await it("parses pending statuses", () => {
            assert.strictEqual(toCypressStatus("pending"), CypressStatus.PENDING);
        });
        await it("parses skipped statuses", () => {
            assert.strictEqual(toCypressStatus("skipped"), CypressStatus.SKIPPED);
        });
        await it("throws for unknown statuses", () => {
            assert.throws(() => toCypressStatus("5"), {
                message: "Unknown Cypress test status: 5",
            });
        });
    });

    await describe(getXrayStatus.name, async () => {
        await describe("server", async () => {
            await it("uses PASS as default status name for passed tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.PASSED, false), "PASS");
            });
            await it("uses FAIL as default status name for failed tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.FAILED, false), "FAIL");
            });
            await it("uses TODO as default status name for pending tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.PENDING, false), "TODO");
            });
            await it("uses FAIL as default status name for skipped tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.SKIPPED, false), "FAIL");
            });
        });
        await describe("cloud", async () => {
            await it("uses PASSED as default status name for passed tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.PASSED, true), "PASSED");
            });
            await it("uses FAILED as default status name for failed tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.FAILED, true), "FAILED");
            });
            await it("uses TO DO as default status name for pending tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.PENDING, true), "TO DO");
            });
            await it("uses FAILED as default status name for skipped tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.SKIPPED, true), "FAILED");
            });
        });
        await it("prefers custom passed statuses", () => {
            assert.strictEqual(
                getXrayStatus(CypressStatus.PASSED, true, {
                    passed: "OK",
                }),
                "OK"
            );
        });
        await it("prefers custom failed statuses", () => {
            assert.strictEqual(
                getXrayStatus(CypressStatus.FAILED, true, {
                    failed: "NO",
                }),
                "NO"
            );
        });
        await it("prefers custom pending statuses", () => {
            assert.strictEqual(
                getXrayStatus(CypressStatus.PENDING, true, {
                    pending: "WIP",
                }),
                "WIP"
            );
        });
        await it("prefers custom skipped statuses", () => {
            assert.strictEqual(
                getXrayStatus(CypressStatus.SKIPPED, true, {
                    skipped: "SKIP",
                }),
                "SKIP"
            );
        });
    });
});
