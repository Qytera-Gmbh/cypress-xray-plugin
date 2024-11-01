import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { getOrCall } from "./functions.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(getOrCall.name, () => {
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
