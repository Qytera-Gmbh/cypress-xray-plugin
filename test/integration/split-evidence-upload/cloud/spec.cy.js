describe("template spec", () => {
    it("CYP-2414 split evidence upload", { retries: 5 }, () => {
        cy.screenshot("CYP-2414 screenshot #1");
        cy.screenshot("CYP-2414 screenshot #2");
        cy.screenshot("CYP-2414 screenshot #3");
        expect(true).to.be.true;
    });
});
