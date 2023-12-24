/**
 * Models a basic queue structure.
 *
 * Inspired by:
 * - {@link https://github.com/datastructures-js/queue}
 * - {@link https://www.npmjs.com/package/@datastructures-js/queue}
 *
 * Extends the original queue with a `has` method and removes superfluous methods.
 */
export class Queue<T> {
    private elements: T[];
    private offset: number;

    /**
     * Constructs a new queue.
     *
     * @param elements - the initial elements
     */
    constructor(elements?: T[]) {
        this.elements = elements ?? [];
        this.offset = 0;
    }

    /**
     * Adds an element to the back of the queue.
     *
     * @param element - the element
     */
    public enqueue(element: T): this {
        this.elements.push(element);
        return this;
    }

    /**
     * Dequeues the front element in the queue.
     *
     * @returns the front element
     * @throws if the queue is empty
     */
    public dequeue(): T {
        const first = this.peek();
        this.offset += 1;
        if (this.offset * 2 < this.elements.length) {
            return first;
        }
        this.elements = this.elements.slice(this.offset);
        this.offset = 0;
        return first;
    }

    /**
     * Returns the front element of the queue without dequeuing it.
     *
     * @returns the front element
     * @throws if the queue is empty
     */
    public peek(): T {
        if (this.size() === 0) {
            throw new Error("Queue is empty");
        }
        return this.elements[this.offset];
    }

    /**
     * Returns the number of elements in the queue.
     *
     * @returns the size
     */
    public size(): number {
        return this.elements.length - this.offset;
    }

    /**
     * Returns whether the queue already contains a specific element.
     *
     * @param element - the element
     * @returns `true` if the queue contains the element, otherwise `false`
     */
    public has(element: T): boolean {
        for (let i = this.offset; i < this.elements.length; i++) {
            if (this.elements[i] === element) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if the queue is empty.
     *
     * @returns `true` if the queue is empty, otherwise `false`
     */
    public isEmpty(): boolean {
        return this.size() === 0;
    }
}
