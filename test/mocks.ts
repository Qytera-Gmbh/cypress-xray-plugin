import { unknownToString } from "../src/util/string";

export function getMockedCypress(): {
    cy: Cypress.cy & CyEventEmitter;
    cypress: Cypress.Cypress & CyEventEmitter;
} {
    global.Cypress = {
        ["Commands"]: {},
        currentTest: {},
    } as Cypress.Cypress & CyEventEmitter;
    global.cy = {
        task: () => {
            throw new Error("Mock called unexpectedly");
        },
    } as unknown as Cypress.cy & CyEventEmitter;
    return { cy: global.cy, cypress: global.Cypress };
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function stub<R>(): (...args: unknown[]) => R {
    return (...args: unknown[]): R => {
        throw new Error(`Mock called unexpectedly with args: ${unknownToString(args)}`);
    };
}

export function countingMock<R>(...returnValues: R[]) {
    let n = 1;
    return (...args: unknown[]): R => {
        if (n - 1 >= returnValues.length) {
            const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
            throw new Error(
                `Mock called unexpectedly for the ${n.toString()}${suffix} time with args: ${unknownToString(args)}`
            );
        }
        return returnValues[n++ - 1];
    };
}
