describe("template spec", () => {
    it("CXP-14 split evidence upload", () => {
        cy.screenshot("CXP-14 screenshot #1");
        cy.screenshot("CXP-14 screenshot #2");
        cy.screenshot("CXP-14 screenshot #3");
        expect(true).to.be.true;
    });
});
