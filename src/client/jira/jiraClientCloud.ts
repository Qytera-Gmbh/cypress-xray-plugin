import { BasicAuthCredentials } from "../../authentication/credentials";
import { AttachmentCloud } from "../../types/jira/responses/attachment";
import { IssueTypeDetailsCloud } from "../../types/jira/responses/issueTypeDetails";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Cloud instances.
 */
export class JiraClientCloud extends JiraClient<AttachmentCloud, IssueTypeDetailsCloud> {
    /**
     * Construct a new Jira Cloud client using the provided credentials.
     *
     * @param apiBaseURL the Jira base endpoint
     * @param credentials the credentials to use during authentication
     */
    constructor(apiBaseURL: string, credentials: BasicAuthCredentials) {
        super(apiBaseURL, credentials);
    }

    public getUrlAddAttachment(issueIdOrKey: string): string {
        return `${this.apiBaseURL}/rest/api/3/issue/${issueIdOrKey}/attachments`;
    }

    public getUrlGetIssueTypes(): string {
        return `${this.apiBaseURL}/rest/api/3/issuetype`;
    }

    public getUrlGetFields(): string {
        return `${this.apiBaseURL}/rest/api/3/field`;
    }
}
