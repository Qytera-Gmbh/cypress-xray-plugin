import { BasicAuthCredentials, PATCredentials } from "../../authentication/credentials";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Server instances.
 */
export class JiraClientServer extends JiraClient {
    constructor(apiBaseUrl: string, credentials: BasicAuthCredentials | PATCredentials) {
        super(apiBaseUrl, credentials);
    }

    public getUrlAddAttachment(issueIdOrKey: string): string {
        return `${this.apiBaseUrl}/rest/api/2/issue/${issueIdOrKey}/attachments`;
    }

    public getUrlGetIssueTypes(): string {
        return `${this.apiBaseUrl}/rest/api/2/issuetype`;
    }

    public getUrlGetFields(): string {
        return `${this.apiBaseUrl}/rest/api/2/field`;
    }

    public getUrlPostSearch(): string {
        return `${this.apiBaseUrl}/rest/api/2/search`;
    }

    public getUrlEditIssue(issueIdOrKey: string): string {
        return `${this.apiBaseUrl}/rest/api/2/issue/${issueIdOrKey}`;
    }
}
