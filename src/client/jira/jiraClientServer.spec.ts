/// <reference types="cypress" />

import { expect } from "chai";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientServer } from "./jiraClientServer";

describe("the jira server client", () => {
    const client: JiraClientServer = new JiraClientServer(
        "https://example.org",
        new BasicAuthCredentials("user", "token")
    );

    describe("the urls", () => {
        it("add attachment", () => {
            expect(client.getUrlAddAttachment("CYP-123")).to.eq(
                "https://example.org/rest/api/2/issue/CYP-123/attachments"
            );
        });
        it("issue types", () => {
            expect(client.getUrlGetIssueTypes()).to.eq("https://example.org/rest/api/2/issuetype");
        });
        it("edit issue", () => {
            expect(client.getUrlEditIssue("CYP-123")).to.eq(
                "https://example.org/rest/api/2/issue/CYP-123"
            );
        });
    });
});
