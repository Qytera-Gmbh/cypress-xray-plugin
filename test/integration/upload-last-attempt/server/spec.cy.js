describe("template spec", () => {
    it("CYPLUG-1692 passes eventually", { retries: 5 }, () => {
        cy.screenshot("CYP-1692 my screenshot");
        cy.then(() => expect(Cypress.currentRetry).to.eq(5));
    });

    it("CYP-1694 manual screenshot", { retries: 2 }, () => {
        cy.screenshot("CYP-1694 my screenshot");
        cy.then(() => expect(true).to.be.false);
    });
});
