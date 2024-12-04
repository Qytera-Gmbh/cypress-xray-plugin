import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getOrCall } from "./functions";

describe(relative(cwd(), __filename), async () => {
    await describe(getOrCall.name, async () => {
        await it("returns unwrapped values", async () => {
            assert.strictEqual(await getOrCall("hello"), "hello");
        });

        await it("resolves sync callbacks", async () => {
            assert.strictEqual(await getOrCall(() => 5), 5);
        });

        await it("resolves async callbacks", async () => {
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
