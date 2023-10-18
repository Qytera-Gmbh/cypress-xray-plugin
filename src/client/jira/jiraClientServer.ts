import { BasicAuthCredentials, PATCredentials } from "../../authentication/credentials";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Server instances.
 */
export class JiraClientServer extends JiraClient {
    constructor(apiBaseURL: string, credentials: BasicAuthCredentials | PATCredentials) {
        super(apiBaseURL, credentials);
    }

    public getUrlAddAttachment(issueIdOrKey: string): string {
        return `${this.apiBaseURL}/rest/api/2/issue/${issueIdOrKey}/attachments`;
    }

    public getUrlGetIssueTypes(): string {
        return `${this.apiBaseURL}/rest/api/2/issuetype`;
    }

    public getUrlGetFields(): string {
        return `${this.apiBaseURL}/rest/api/2/field`;
    }

    public getUrlPostSearch(): string {
        return `${this.apiBaseURL}/rest/api/2/search`;
    }

    public getUrlEditIssue(issueIdOrKey: string): string {
        return `${this.apiBaseURL}/rest/api/2/issue/${issueIdOrKey}`;
    }
}
