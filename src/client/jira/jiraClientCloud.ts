import { AbstractJiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Cloud instances.
 */
export class JiraClientCloud extends AbstractJiraClient {
    public getUrlAddAttachment(issueIdOrKey: string): string {
        return `${this.apiBaseUrl}/rest/api/3/issue/${issueIdOrKey}/attachments`;
    }

    public getUrlGetIssueTypes(): string {
        return `${this.apiBaseUrl}/rest/api/3/issuetype`;
    }

    public getUrlGetFields(): string {
        return `${this.apiBaseUrl}/rest/api/3/field`;
    }

    public getUrlPostSearch(): string {
        return `${this.apiBaseUrl}/rest/api/3/search`;
    }

    public getUrlEditIssue(issueIdOrKey: string): string {
        return `${this.apiBaseUrl}/rest/api/3/issue/${issueIdOrKey}`;
    }
}
