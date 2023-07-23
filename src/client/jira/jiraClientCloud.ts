import { BasicAuthCredentials } from "../../authentication/credentials";
import { SearchRequestCloud } from "../../types/jira/requests/search";
import { AttachmentCloud } from "../../types/jira/responses/attachment";
import { FieldDetailCloud } from "../../types/jira/responses/fieldDetail";
import { IssueCloud } from "../../types/jira/responses/issue";
import { IssueTypeDetailsCloud } from "../../types/jira/responses/issueTypeDetails";
import { JsonTypeCloud } from "../../types/jira/responses/jsonType";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Cloud instances.
 */
export class JiraClientCloud extends JiraClient<
    BasicAuthCredentials,
    AttachmentCloud,
    FieldDetailCloud,
    JsonTypeCloud,
    IssueCloud,
    IssueTypeDetailsCloud,
    SearchRequestCloud
> {
    public getUrlAddAttachment(issueIdOrKey: string): string {
        return `${this.apiBaseURL}/rest/api/3/issue/${issueIdOrKey}/attachments`;
    }

    public getUrlGetIssueTypes(): string {
        return `${this.apiBaseURL}/rest/api/3/issuetype`;
    }

    public getUrlGetFields(): string {
        return `${this.apiBaseURL}/rest/api/3/field`;
    }

    public getUrlPostSearch(): string {
        return `${this.apiBaseURL}/rest/api/3/search`;
    }
}
