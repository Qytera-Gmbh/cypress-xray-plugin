/// <reference types="cypress" />

// Currently not in use.
Cypress.on("test:after:run", (test: Cypress.ObjectLike, runnable: Mocha.Test) => {
    // console.log("test:after:run", test, runnable);
});
