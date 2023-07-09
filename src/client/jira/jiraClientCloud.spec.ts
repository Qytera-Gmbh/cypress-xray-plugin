/// <reference types="cypress" />

import { expect } from "chai";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientCloud } from "./jiraClientCloud";

describe("the Jira Cloud client", () => {
    const client: JiraClientCloud = new JiraClientCloud(
        "https://example.org",
        new BasicAuthCredentials("user", "xyz")
    );

    describe("the URLs", () => {
        it("issue types", () => {
            expect(client.getUrlGetIssueTypes()).to.eq("https://example.org/rest/api/3/issuetype");
        });
    });
});
