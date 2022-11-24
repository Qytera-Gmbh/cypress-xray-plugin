/// <reference types="cypress" />

// =================================== //
// These events do not work currently. //
// I don't know why, seems like a bug  //
// in Cypress?                         //
// =================================== //

Cypress.on(
    "test:after:run",
    (test: Cypress.ObjectLike, runnable: Mocha.Test) => {
        console.log("test:after:run", test, runnable);
    }
);
