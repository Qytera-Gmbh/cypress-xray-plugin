const { enqueueTask, PluginTask } = require("cypress-xray-plugin/commands/tasks");

it("Test CYPLUG-2932", () => {
    cy.visit("localhost:8080");
    cy.task(PluginTask.EVIDENCE_ATTACHMENT, {
        evidence: {
            filename: "hello.txt",
            data: Buffer.from("hello world").toString("base64"),
            contentType: "text/plain",
        },
        test: Cypress.currentTest.titlePath.join(" "),
    });
    enqueueTask("cypress-xray-plugin:task:evidence:attachment", {
        filename: "goodbye.txt",
        data: Buffer.from("see you later").toString("base64"),
        contentType: "text/plain",
    });
    expect(true).to.eq(true);
});
