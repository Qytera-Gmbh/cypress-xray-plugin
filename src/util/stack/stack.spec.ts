import { expect } from "chai";
import path from "path";
import { Stack } from "./stack";

describe(path.relative(process.cwd(), __filename), () => {
    let stack = new Stack<number>();

    beforeEach(() => {
        stack = new Stack<number>();
    });

    describe(stack.push.name, () => {
        it("pushes elements", () => {
            stack.push(10);
            expect(stack.top()).to.eq(10);
            stack.push(15);
            expect(stack.top()).to.eq(15);
        });
    });

    describe(stack.pop.name, () => {
        it("pops elements", () => {
            stack.push(0).push(1).push(2).push(3).push(4);
            expect(stack.pop()).to.eq(4);
            expect(stack.pop()).to.eq(3);
            expect(stack.pop()).to.eq(2);
            expect(stack.pop()).to.eq(1);
            expect(stack.pop()).to.eq(0);
        });

        it("throws if the stack is empty", () => {
            expect(() => stack.pop()).to.throw("Stack is empty");
        });
    });

    describe(stack.top.name, () => {
        it("returns the top element", () => {
            stack.push(0);
            expect(stack.top()).to.eq(0);
            stack.push(1);
            expect(stack.top()).to.eq(1);
            stack.push(2);
            expect(stack.top()).to.eq(2);
        });

        it("throws if the stack is empty", () => {
            expect(() => stack.top()).to.throw("Stack is empty");
        });
    });

    describe(stack.size.name, () => {
        it("computes the size", () => {
            expect(stack.size()).to.eq(0);
            stack.push(0);
            expect(stack.size()).to.eq(1);
            stack.push(1);
            expect(stack.size()).to.eq(2);
            stack.pop();
            expect(stack.size()).to.eq(1);
            stack.pop();
            expect(stack.size()).to.eq(0);
        });
    });

    describe(stack.has.name, () => {
        it("finds elements", () => {
            stack.push(0).push(1).push(2).push(3).push(4);
            expect(stack.has(0)).to.be.true;
            expect(stack.has(1)).to.be.true;
            expect(stack.has(2)).to.be.true;
            expect(stack.has(3)).to.be.true;
            expect(stack.has(4)).to.be.true;
        });

        it("does not find nonexistent elements", () => {
            stack.push(0).push(1).push(2);
            expect(stack.has(4)).to.be.false;
        });
    });

    describe(stack.isEmpty.name, () => {
        it("computes the emptiness", () => {
            expect(stack.isEmpty()).to.be.true;
            stack.push(0);
            expect(stack.isEmpty()).to.be.false;
            stack.push(1);
            expect(stack.isEmpty()).to.be.false;
            stack.pop();
            expect(stack.isEmpty()).to.be.false;
            stack.pop();
            expect(stack.isEmpty()).to.be.true;
        });
    });
});
