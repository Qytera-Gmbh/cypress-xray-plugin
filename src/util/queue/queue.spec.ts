import { expect } from "chai";
import { Queue } from "./queue";

describe("queue", () => {
    let queue = new Queue<number>();

    beforeEach(() => {
        queue = new Queue<number>();
    });

    describe(queue.enqueue.name, () => {
        it("enqueues elements", () => {
            queue.enqueue(10);
            expect(queue.peek()).to.eq(10);
            queue.enqueue(15);
            expect(queue.peek()).to.eq(10);
        });
    });

    describe(queue.dequeue.name, () => {
        it("dequeues elements", () => {
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
            expect(queue.dequeue()).to.eq(0);
            expect(queue.dequeue()).to.eq(1);
            expect(queue.dequeue()).to.eq(2);
            expect(queue.dequeue()).to.eq(3);
            expect(queue.dequeue()).to.eq(4);
            expect(queue.dequeue()).to.eq(5);
            expect(queue.dequeue()).to.eq(6);
            expect(queue.dequeue()).to.eq(7);
            expect(queue.dequeue()).to.eq(8);
        });

        it("throws if the queue is empty", () => {
            expect(() => queue.dequeue()).to.throw("Queue is empty");
        });
    });

    describe(queue.peek.name, () => {
        it("peeks elements", () => {
            queue.enqueue(0);
            expect(queue.peek()).to.eq(0);
            queue.enqueue(1);
            expect(queue.peek()).to.eq(0);
            queue.enqueue(2);
            expect(queue.peek()).to.eq(0);
        });

        it("throws if the queue is empty", () => {
            expect(() => queue.peek()).to.throw("Queue is empty");
        });
    });

    describe(queue.size.name, () => {
        it("computes the size", () => {
            expect(queue.size()).to.eq(0);
            queue.enqueue(0);
            expect(queue.size()).to.eq(1);
            queue.enqueue(1);
            expect(queue.size()).to.eq(2);
            queue.dequeue();
            expect(queue.size()).to.eq(1);
            queue.dequeue();
            expect(queue.size()).to.eq(0);
        });
    });

    describe(queue.has.name, () => {
        it("returns true for known elements", () => {
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
            expect(queue.has(0)).to.be.true;
            expect(queue.has(1)).to.be.true;
            expect(queue.has(2)).to.be.true;
            expect(queue.has(3)).to.be.true;
            expect(queue.has(4)).to.be.true;
            expect(queue.has(5)).to.be.true;
            expect(queue.has(6)).to.be.true;
            expect(queue.has(7)).to.be.true;
            expect(queue.has(8)).to.be.true;
        });

        it("returns false for unknown elements", () => {
            queue.enqueue(0).enqueue(1).enqueue(2);
            expect(queue.has(4)).to.be.false;
        });
    });

    describe(queue.find.name, () => {
        it("finds elements", () => {
            queue.enqueue(0).enqueue(1).enqueue(2);
            expect(queue.find((e) => e === 0)).to.eq(0);
            expect(queue.find((e) => e === 1)).to.eq(1);
            expect(queue.find((e) => e === 2)).to.eq(2);
        });

        it("does not find nonexistent elements", () => {
            queue.enqueue(0).enqueue(1).enqueue(2);
            expect(queue.find((e) => e === 4)).to.be.undefined;
        });
    });

    describe(queue.isEmpty.name, () => {
        it("computes the emptiness", () => {
            expect(queue.isEmpty()).to.be.true;
            queue.enqueue(0);
            expect(queue.isEmpty()).to.be.false;
            queue.enqueue(1);
            expect(queue.isEmpty()).to.be.false;
            queue.dequeue();
            expect(queue.isEmpty()).to.be.false;
            queue.dequeue();
            expect(queue.isEmpty()).to.be.true;
        });
    });
});
