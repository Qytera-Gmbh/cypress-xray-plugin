import { enqueueTask, PluginTask } from "cypress-xray-plugin/commands/tasks";

describe("CYPLUG-1411 Test Suite Name", () => {
    for (const test of ["#1", "#2", "#3"]) {
        it(`Test Method ${test}`, () => {
            cy.visit("localhost:8080");
            cy.task(PluginTask.ITERATION_DEFINITION, {
                parameters: {
                    hello: "there",
                    good: "morning",
                    using: "cy.task",
                    id: test,
                },
                test: Cypress.currentTest.titlePath.join(" "),
            });
            expect(true).to.eq(true);
        });
    }

    it("Test Method Name 2", () => {
        cy.visit("localhost:8080");
        enqueueTask("cypress-xray-plugin:task:iteration:definition", {
            hello: "there",
            good: "morning",
            using: "enqueueTask",
        });
        expect(true).to.eq(true);
    });
});
