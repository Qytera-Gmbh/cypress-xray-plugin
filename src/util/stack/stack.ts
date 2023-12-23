/**
 * Models a basic stack structure.
 */
export class Stack<T> {
    private readonly elements: T[];

    /**
     * Constructs a new stack.
     *
     * @param elements - the initial elements
     */
    constructor(elements?: T[]) {
        this.elements = elements ?? [];
    }

    /**
     * Pushes an element on top of the stack.
     *
     * @param element - the element
     */
    public push(element: T): Stack<T> {
        this.elements.push(element);
        return this;
    }

    /**
     * Pops the top element off the stack.
     *
     * @returns the top element
     */
    public pop(): T {
        const top = this.elements.pop();
        if (top === undefined) {
            throw new Error("Stack is empty");
        }
        return top;
    }

    /**
     * Returns the top element of the stack without popping it.
     *
     * @returns the top element
     */
    public top(): T {
        if (this.size() === 0) {
            throw new Error("Stack is empty");
        }
        return this.elements[this.elements.length - 1];
    }

    /**
     * Returns the number of elements in the stack.
     *
     * @returns the size
     */
    public size(): number {
        return this.elements.length;
    }

    /**
     * Returns whether the stack already contains a specific element.
     *
     * @param element - the element
     * @returns `true` if the stack contains the element, otherwise `false`
     */
    public has(element: T): boolean {
        return this.elements.includes(element);
    }

    /**
     * Checks if the stack is empty.
     *
     * @returns `true` if the stack is empty, otherwise `false`
     */
    public isEmpty(): boolean {
        return this.size() === 0;
    }
}
