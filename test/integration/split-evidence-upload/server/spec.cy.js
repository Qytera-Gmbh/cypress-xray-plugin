describe("template spec", () => {
    it("CYPLUG-1572 split evidence upload", () => {
        cy.screenshot("CYPLUG-1572 screenshot #1");
        cy.screenshot("CYPLUG-1572 screenshot #2");
        cy.screenshot("CYPLUG-1572 screenshot #3");
        expect(true).to.be.true;
    });
});
