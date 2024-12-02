import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { Stack } from "./stack";

describe(relative(cwd(), __filename), async () => {
    let stack = new Stack<number>();

    beforeEach(() => {
        stack = new Stack<number>();
    });

    await describe(stack.push.name, async () => {
        await it("pushes elements", () => {
            stack.push(10);
            assert.strictEqual(stack.top(), 10);
            stack.push(15);
            assert.strictEqual(stack.top(), 15);
        });
    });

    await describe(stack.pop.name, async () => {
        await it("pops elements", () => {
            stack.push(0).push(1).push(2).push(3).push(4);
            assert.strictEqual(stack.pop(), 4);
            assert.strictEqual(stack.pop(), 3);
            assert.strictEqual(stack.pop(), 2);
            assert.strictEqual(stack.pop(), 1);
            assert.strictEqual(stack.pop(), 0);
        });

        await it("throws if the stack is empty", () => {
            assert.throws(() => stack.pop(), { message: "Stack is empty" });
        });
    });

    await describe(stack.top.name, async () => {
        await it("returns the top element", () => {
            stack.push(0);
            assert.strictEqual(stack.top(), 0);
            stack.push(1);
            assert.strictEqual(stack.top(), 1);
            stack.push(2);
            assert.strictEqual(stack.top(), 2);
        });

        await it("throws if the stack is empty", () => {
            assert.throws(() => stack.top(), { message: "Stack is empty" });
        });
    });

    await describe(stack.size.name, async () => {
        await it("computes the size", () => {
            assert.strictEqual(stack.size(), 0);
            stack.push(0);
            assert.strictEqual(stack.size(), 1);
            stack.push(1);
            assert.strictEqual(stack.size(), 2);
            stack.pop();
            assert.strictEqual(stack.size(), 1);
            stack.pop();
            assert.strictEqual(stack.size(), 0);
        });
    });

    await describe(stack.has.name, async () => {
        await it("finds elements", () => {
            stack.push(0).push(1).push(2).push(3).push(4);
            assert.strictEqual(stack.has(0), true);
            assert.strictEqual(stack.has(1), true);
            assert.strictEqual(stack.has(2), true);
            assert.strictEqual(stack.has(3), true);
            assert.strictEqual(stack.has(4), true);
        });

        await it("does not find nonexistent elements", () => {
            stack.push(0).push(1).push(2);
            assert.strictEqual(stack.has(4), false);
        });
    });

    await describe(stack.isEmpty.name, async () => {
        await it("computes the emptiness", () => {
            assert.strictEqual(stack.isEmpty(), true);
            stack.push(0);
            assert.strictEqual(stack.isEmpty(), false);
            stack.push(1);
            assert.strictEqual(stack.isEmpty(), false);
            stack.pop();
            assert.strictEqual(stack.isEmpty(), false);
            stack.pop();
            assert.strictEqual(stack.isEmpty(), true);
        });
    });
});
