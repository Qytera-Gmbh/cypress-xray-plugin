describe("template spec", () => {
    it("CYPLUG-1692 passes eventually", { retries: 5 }, () => {
        cy.screenshot("CYPLUG-1692 my screenshot");
        cy.then(() => expect(Cypress.currentRetry).to.eq(5));
    });

    it("CYPLUG-1694 manual screenshot", { retries: 2 }, () => {
        cy.screenshot("CYPLUG-1694 my other screenshot");
        cy.then(() => expect(true).to.be.false);
    });
});
