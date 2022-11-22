/// <reference types="cypress" />

Cypress.on("test:after:run", (test: Cypress.ObjectLike) => {
  console.log("test:after:run", test);
});
