describe("CYPLUG-1082 Test Suite Name", () => {
    it("Test Method Name 1", () => {
        cy.visit("localhost:8080");
        cy.screenshot("CYPLUG-1082-test-evidence-1");
        expect(true).to.eq(false);
    });

    it("Test Method Name 2", () => {
        cy.visit("localhost:8080");
        cy.screenshot("CYPLUG-1082-test-evidence-2");
        expect(true).to.eq(true);
    });
});
