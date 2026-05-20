describe("template spec", () => {
    it("CXP-17 passes eventually", { retries: 5 }, () => {
        cy.screenshot("CXP-17 my screenshot");
        cy.then(() => expect(Cypress.currentRetry).to.eq(5));
    });

    it("CXP-18 manual screenshot", { retries: 2 }, () => {
        cy.screenshot("CXP-18 my other screenshot");
        cy.then(() => expect(true).to.be.false);
    });
});
