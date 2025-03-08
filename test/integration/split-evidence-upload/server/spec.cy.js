describe("template spec", () => {
    it("CYPLUG-1672 split evidence upload", () => {
        cy.screenshot("CYPLUG-1672 screenshot #1");
        cy.screenshot("CYPLUG-1672 screenshot #2");
        cy.screenshot("CYPLUG-1672 screenshot #3");
        expect(true).to.be.true;
    });
});
