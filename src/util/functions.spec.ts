import { expect } from "chai";
import path from "node:path";
import { getOrCall } from "./functions";

describe(path.relative(process.cwd(), __filename), () => {
    describe(getOrCall.name, () => {
        it("returns unwrapped values", async () => {
            expect(await getOrCall("hello")).to.eq("hello");
        });

        it("resolves sync callbacks", async () => {
            expect(await getOrCall(() => 5)).to.eq(5);
        });

        it("resolves async callbacks", async () => {
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
