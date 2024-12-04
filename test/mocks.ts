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
