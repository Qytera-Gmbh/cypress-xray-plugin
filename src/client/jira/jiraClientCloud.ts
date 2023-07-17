import { BasicAuthCredentials } from "../../authentication/credentials";
import { AttachmentCloud } from "../../types/jira/responses/attachment";
import { JiraClient } from "./jiraClient";

/**
 * A Jira client class for communicating with Jira Cloud instances.
 */
export class JiraClientCloud extends JiraClient<AttachmentCloud> {
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

    public getUrlGetFields(): string {
        return `${this.apiBaseURL}/rest/api/3/field`;
    }
}
