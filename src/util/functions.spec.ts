import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getOrCall } from "./functions";

void describe(relative(cwd(), __filename), () => {
    void describe(getOrCall.name, () => {
        void it("returns unwrapped values", async () => {
            assert.strictEqual(await getOrCall("hello"), "hello");
        });

        void it("resolves sync callbacks", async () => {
            assert.strictEqual(await getOrCall(() => 5), 5);
        });

        void it("resolves async callbacks", async () => {
            assert.strictEqual(
                await getOrCall(async () => {
                    return new Promise((resolve) => {
                        resolve(5);
                    });
                }),
                5
            );
        });
    });
});
