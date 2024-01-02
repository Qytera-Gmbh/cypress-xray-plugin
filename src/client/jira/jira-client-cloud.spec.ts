/// <reference types="cypress" />

import { expect } from "chai";
import { BasicAuthCredentials } from "../authentication/credentials";
import { JiraClientCloud } from "./jira-client-cloud";

describe("the jira cloud client", () => {
    const client: JiraClientCloud = new JiraClientCloud(
        "https://example.org",
        new BasicAuthCredentials("user", "token")
    );

    describe("the urls", () => {
        it("add attachment", () => {
            expect(client.getUrlAddAttachment("CYP-123")).to.eq(
                "https://example.org/rest/api/3/issue/CYP-123/attachments"
            );
        });
        it("issue types", () => {
            expect(client.getUrlGetIssueTypes()).to.eq("https://example.org/rest/api/3/issuetype");
        });
        it("edit issue", () => {
            expect(client.getUrlEditIssue("CYP-123")).to.eq(
                "https://example.org/rest/api/3/issue/CYP-123"
            );
        });
    });
});
