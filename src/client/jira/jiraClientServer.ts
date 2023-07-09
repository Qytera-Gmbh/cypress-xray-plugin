import { AttachmentServer } from "../../types/jira/responses/attachment";
import { IssueTypeDetailsServer } from "../../types/jira/responses/issueTypeDetails";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Server instances.
 */
export class JiraClientServer extends JiraClient<AttachmentServer, IssueTypeDetailsServer> {
    public getUrlGetIssueTypes(): string {
        return `${this.apiBaseURL}/rest/api/2/issuetype`;
    }
}
