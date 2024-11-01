import { expect } from "chai";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getOrCall } from "./functions.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(getOrCall.name, async () => {
        await it("returns unwrapped values", async () => {
            expect(await getOrCall("hello")).to.eq("hello");
        });

        await it("resolves sync callbacks", async () => {
            expect(await getOrCall(() => 5)).to.eq(5);
        });

        await it("resolves async callbacks", async () => {
            expect(
                await getOrCall(async () => {
                    return new Promise((resolve) => {
                        resolve(5);
                    });
                })
            ).to.eq(5);
        });
    });
});
