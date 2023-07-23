import { BasicAuthCredentials, PATCredentials } from "../../authentication/credentials";
import { SearchRequestServer } from "../../types/jira/requests/search";
import { AttachmentServer } from "../../types/jira/responses/attachment";
import { FieldDetailServer } from "../../types/jira/responses/fieldDetail";
import { IssueServer } from "../../types/jira/responses/issue";
import { IssueTypeDetailsServer } from "../../types/jira/responses/issueTypeDetails";
import { JsonTypeServer } from "../../types/jira/responses/jsonType";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Server instances.
 */
export class JiraClientServer extends JiraClient<
    BasicAuthCredentials | PATCredentials,
    AttachmentServer,
    FieldDetailServer,
    JsonTypeServer,
    IssueServer,
    IssueTypeDetailsServer,
    SearchRequestServer
> {
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
}
