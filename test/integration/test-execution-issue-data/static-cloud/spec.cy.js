describe("CXP-16 template spec", () => {
    it("passes", () => {
        cy.visit("localhost:8080");
        cy.task("update-labels", []);
    });
});
