import on from "./handler";

Cypress.Commands.overwrite("request", (originalFn, options) => {
    return on("cy.request", originalFn, options);
});
