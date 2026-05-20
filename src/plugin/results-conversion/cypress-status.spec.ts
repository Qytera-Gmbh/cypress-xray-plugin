import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { CypressStatus } from "../../models/cypress/status";
import { getXrayStatus, toCypressStatus } from "./cypress-status";

void describe(relative(cwd(), __filename), () => {
    void describe(toCypressStatus.name, () => {
        void it("parses passed statuses", () => {
            assert.strictEqual(toCypressStatus("passed"), CypressStatus.PASSED);
        });
        void it("parses failed statuses", () => {
            assert.strictEqual(toCypressStatus("failed"), CypressStatus.FAILED);
        });
        void it("parses pending statuses", () => {
            assert.strictEqual(toCypressStatus("pending"), CypressStatus.PENDING);
        });
        void it("parses skipped statuses", () => {
            assert.strictEqual(toCypressStatus("skipped"), CypressStatus.SKIPPED);
        });
        void it("throws for unknown statuses", () => {
            assert.throws(() => toCypressStatus("5"), {
                message: "Unknown Cypress test status: 5",
            });
        });
    });

    void describe(getXrayStatus.name, () => {
        void describe("server", () => {
            void it("uses PASS as default status name for passed tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.PASSED, false), "PASS");
            });
            void it("uses FAIL as default status name for failed tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.FAILED, false), "FAIL");
            });
            void it("uses TODO as default status name for pending tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.PENDING, false), "TODO");
            });
            void it("uses FAIL as default status name for skipped tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.SKIPPED, false), "FAIL");
            });
        });
        void describe("cloud", () => {
            void it("uses PASSED as default status name for passed tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.PASSED, true), "PASSED");
            });
            void it("uses FAILED as default status name for failed tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.FAILED, true), "FAILED");
            });
            void it("uses TO DO as default status name for pending tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.PENDING, true), "TO DO");
            });
            void it("uses FAILED as default status name for skipped tests", () => {
                assert.strictEqual(getXrayStatus(CypressStatus.SKIPPED, true), "FAILED");
            });
        });
        void it("prefers custom passed statuses", () => {
            assert.strictEqual(
                getXrayStatus(CypressStatus.PASSED, true, {
                    passed: "OK",
                }),
                "OK"
            );
        });
        void it("prefers custom failed statuses", () => {
            assert.strictEqual(
                getXrayStatus(CypressStatus.FAILED, true, {
                    failed: "NO",
                }),
                "NO"
            );
        });
        void it("prefers custom pending statuses", () => {
            assert.strictEqual(
                getXrayStatus(CypressStatus.PENDING, true, {
                    pending: "WIP",
                }),
                "WIP"
            );
        });
        void it("prefers custom skipped statuses", () => {
            assert.strictEqual(
                getXrayStatus(CypressStatus.SKIPPED, true, {
                    skipped: "SKIP",
                }),
                "SKIP"
            );
        });
    });
});
