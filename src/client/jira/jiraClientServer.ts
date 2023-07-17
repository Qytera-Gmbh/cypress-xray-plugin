import { BasicAuthCredentials, PATCredentials } from "../../authentication/credentials";
import { SearchRequestServer } from "../../types/jira/requests/search";
import { AttachmentServer } from "../../types/jira/responses/attachment";
import { FieldDetailServer } from "../../types/jira/responses/fieldDetail";
import { SearchResultsServer } from "../../types/jira/responses/searchResults";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Server instances.
 */
export class JiraClientServer extends JiraClient<
    BasicAuthCredentials | PATCredentials,
    AttachmentServer,
    FieldDetailServer,
    SearchRequestServer,
    SearchResultsServer
> {
    public getUrlAddAttachment(issueIdOrKey: string): string {
        return `${this.apiBaseURL}/rest/api/2/issue/${issueIdOrKey}/attachments`;
    }

    public getUrlGetFields(): string {
        return `${this.apiBaseURL}/rest/api/2/field`;
    }

    public getUrlPostSearch(): string {
        return `${this.apiBaseURL}/rest/api/2/search`;
    }
}
