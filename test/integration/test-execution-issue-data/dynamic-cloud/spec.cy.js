describe("CXP-15 template spec", () => {
    it("passes", () => {
        cy.visit("localhost:8080");
        cy.task("update-labels", ["x", "y"]);
    });
});
