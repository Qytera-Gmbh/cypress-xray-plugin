describe("template spec", () => {
    it("CYP-2432 passes eventually", { retries: 5 }, () => {
        cy.screenshot("CYP-2432 my screenshot");
        cy.then(() => expect(Cypress.currentRetry).to.eq(5));
    });

    it("CYP-2434 manual screenshot", { retries: 2 }, () => {
        cy.screenshot("CYP-2434 my screenshot");
        cy.then(() => expect(true).to.be.false);
    });
});
