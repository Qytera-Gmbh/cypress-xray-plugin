import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { CypressStatus } from "../../../../../../types/cypress/status.js";
import { getXrayStatus, toCypressStatus } from "./status.js";

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
    await describe(toCypressStatus.name, async () => {
        await it("parses passed statuses", () => {
            expect(toCypressStatus("passed")).to.eq(CypressStatus.PASSED);
        });
        await it("parses failed statuses", () => {
            expect(toCypressStatus("failed")).to.eq(CypressStatus.FAILED);
        });
        await it("parses pending statuses", () => {
            expect(toCypressStatus("pending")).to.eq(CypressStatus.PENDING);
        });
        await it("parses skipped statuses", () => {
            expect(toCypressStatus("skipped")).to.eq(CypressStatus.SKIPPED);
        });
        await it("throws for unknown statuses", () => {
            expect(() => toCypressStatus("5")).to.throw("Unknown Cypress test status: 5");
        });
    });

    await describe(getXrayStatus.name, async () => {
        await describe("server", async () => {
            await it("uses PASS as default status name for passed tests", () => {
                expect(getXrayStatus(CypressStatus.PASSED, false)).to.eq("PASS");
            });
            await it("uses FAIL as default status name for failed tests", () => {
                expect(getXrayStatus(CypressStatus.FAILED, false)).to.eq("FAIL");
            });
            await it("uses TODO as default status name for pending tests", () => {
                expect(getXrayStatus(CypressStatus.PENDING, false)).to.eq("TODO");
            });
            await it("uses FAIL as default status name for skipped tests", () => {
                expect(getXrayStatus(CypressStatus.SKIPPED, false)).to.eq("FAIL");
            });
        });
        await describe("cloud", async () => {
            await it("uses PASSED as default status name for passed tests", () => {
                expect(getXrayStatus(CypressStatus.PASSED, true)).to.eq("PASSED");
            });
            await it("uses FAILED as default status name for failed tests", () => {
                expect(getXrayStatus(CypressStatus.FAILED, true)).to.eq("FAILED");
            });
            await it("uses TO DO as default status name for pending tests", () => {
                expect(getXrayStatus(CypressStatus.PENDING, true)).to.eq("TO DO");
            });
            await it("uses FAILED as default status name for skipped tests", () => {
                expect(getXrayStatus(CypressStatus.SKIPPED, true)).to.eq("FAILED");
            });
        });
        await it("prefers custom passed statuses", () => {
            expect(
                getXrayStatus(CypressStatus.PASSED, true, {
                    passed: "OK",
                })
            ).to.eq("OK");
        });
        await it("prefers custom failed statuses", () => {
            expect(
                getXrayStatus(CypressStatus.FAILED, true, {
                    failed: "NO",
                })
            ).to.eq("NO");
        });
        await it("prefers custom pending statuses", () => {
            expect(
                getXrayStatus(CypressStatus.PENDING, true, {
                    pending: "WIP",
                })
            ).to.eq("WIP");
        });
        await it("prefers custom skipped statuses", () => {
            expect(
                getXrayStatus(CypressStatus.SKIPPED, true, {
                    skipped: "SKIP",
                })
            ).to.eq("SKIP");
        });
    });
});
