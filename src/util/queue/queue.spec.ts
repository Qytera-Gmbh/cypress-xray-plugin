import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { Queue } from "./queue";

describe(relative(cwd(), __filename), async () => {
    let queue = new Queue<number>();

    beforeEach(() => {
        queue = new Queue<number>();
    });

    await describe(queue.enqueue.name, async () => {
        await it("enqueues elements", () => {
            queue.enqueue(10);
            assert.strictEqual(queue.peek(), 10);
            queue.enqueue(15);
            assert.strictEqual(queue.peek(), 10);
        });
    });

    await describe(queue.dequeue.name, async () => {
        await it("dequeues elements", () => {
            queue
                .enqueue(0)
                .enqueue(1)
                .enqueue(2)
                .enqueue(3)
                .enqueue(4)
                .enqueue(5)
                .enqueue(6)
                .enqueue(7)
                .enqueue(8);
            assert.strictEqual(queue.dequeue(), 0);
            assert.strictEqual(queue.dequeue(), 1);
            assert.strictEqual(queue.dequeue(), 2);
            assert.strictEqual(queue.dequeue(), 3);
            assert.strictEqual(queue.dequeue(), 4);
            assert.strictEqual(queue.dequeue(), 5);
            assert.strictEqual(queue.dequeue(), 6);
            assert.strictEqual(queue.dequeue(), 7);
            assert.strictEqual(queue.dequeue(), 8);
        });

        await it("throws if the queue is empty", () => {
            assert.throws(() => queue.dequeue(), { message: "Queue is empty" });
        });
    });

    await describe(queue.peek.name, async () => {
        await it("peeks elements", () => {
            queue.enqueue(0);
            assert.strictEqual(queue.peek(), 0);
            queue.enqueue(1);
            assert.strictEqual(queue.peek(), 0);
            queue.enqueue(2);
            assert.strictEqual(queue.peek(), 0);
        });

        await it("throws if the queue is empty", () => {
            assert.throws(() => queue.peek(), { message: "Queue is empty" });
        });
    });

    await describe(queue.size.name, async () => {
        await it("computes the size", () => {
            assert.strictEqual(queue.size(), 0);
            queue.enqueue(0);
            assert.strictEqual(queue.size(), 1);
            queue.enqueue(1);
            assert.strictEqual(queue.size(), 2);
            queue.dequeue();
            assert.strictEqual(queue.size(), 1);
            queue.dequeue();
            assert.strictEqual(queue.size(), 0);
        });
    });

    await describe(queue.has.name, async () => {
        await it("returns true for known elements", () => {
            queue
                .enqueue(0)
                .enqueue(1)
                .enqueue(2)
                .enqueue(3)
                .enqueue(4)
                .enqueue(5)
                .enqueue(6)
                .enqueue(7)
                .enqueue(8);
            assert.strictEqual(queue.has(0), true);
            assert.strictEqual(queue.has(1), true);
            assert.strictEqual(queue.has(2), true);
            assert.strictEqual(queue.has(3), true);
            assert.strictEqual(queue.has(4), true);
            assert.strictEqual(queue.has(5), true);
            assert.strictEqual(queue.has(6), true);
            assert.strictEqual(queue.has(7), true);
            assert.strictEqual(queue.has(8), true);
        });

        await it("returns false for unknown elements", () => {
            queue.enqueue(0).enqueue(1).enqueue(2);
            assert.strictEqual(queue.has(4), false);
        });
    });

    await describe(queue.find.name, async () => {
        await it("finds elements", () => {
            queue.enqueue(0).enqueue(1).enqueue(2);
            assert.strictEqual(
                queue.find((e) => e === 0),
                0
            );
            assert.strictEqual(
                queue.find((e) => e === 1),
                1
            );
            assert.strictEqual(
                queue.find((e) => e === 2),
                2
            );
        });

        await it("does not find nonexistent elements", () => {
            queue.enqueue(0).enqueue(1).enqueue(2);
            assert.strictEqual(
                queue.find((e) => e === 4),
                undefined
            );
        });
    });

    await describe(queue.isEmpty.name, async () => {
        await it("computes the emptiness", () => {
            assert.strictEqual(queue.isEmpty(), true);
            queue.enqueue(0);
            assert.strictEqual(queue.isEmpty(), false);
            queue.enqueue(1);
            assert.strictEqual(queue.isEmpty(), false);
            queue.dequeue();
            assert.strictEqual(queue.isEmpty(), false);
            queue.dequeue();
            assert.strictEqual(queue.isEmpty(), true);
        });
    });
});
