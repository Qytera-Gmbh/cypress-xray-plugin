import { AttachmentServer } from "../../types/jira/responses/attachment";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Server instances.
 */
export class JiraClientServer extends JiraClient<AttachmentServer> {
    public getUrlAddAttachment(issueIdOrKey: string): string {
        return `${this.apiBaseURL}/rest/api/2/issue/${issueIdOrKey}/attachments`;
    }

    public getUrlGetFields(): string {
        return `${this.apiBaseURL}/rest/api/2/field`;
    }

    public getUrlSearchIssues(): string {
        return `${this.apiBaseURL}/rest/api/2/search`;
    }
}
