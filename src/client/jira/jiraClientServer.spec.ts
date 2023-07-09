/// <reference types="cypress" />

import { expect } from "chai";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientServer } from "./jiraClientServer";

describe("the Jira Server client", () => {
    const client: JiraClientServer = new JiraClientServer(
        "https://example.org",
        new BasicAuthCredentials("user", "xyz")
    );

    describe("the URLs", () => {
        it("issue types", () => {
            expect(client.getUrlGetIssueTypes()).to.eq("https://example.org/rest/api/2/issuetype");
        });
    });
});
