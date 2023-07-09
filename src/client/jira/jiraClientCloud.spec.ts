/// <reference types="cypress" />

import { expect } from "chai";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientCloud } from "./jiraClientCloud";

describe("the Jira Cloud client", () => {
    const client: JiraClientCloud = new JiraClientCloud(
        "https://example.org",
        new BasicAuthCredentials("user", "token")
    );

    describe("the URLs", () => {
        it("add attachment", () => {
            expect(client.getUrlAddAttachment("CYP-123")).to.eq(
                "https://example.org/rest/api/3/issue/CYP-123/attachments"
            );
        });
        it("issue types", () => {
            expect(client.getUrlGetIssueTypes()).to.eq("https://example.org/rest/api/3/issuetype");
        });
    });
});
