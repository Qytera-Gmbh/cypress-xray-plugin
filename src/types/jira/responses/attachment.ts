import type { DateTimeIso } from "../../util";
import type { User } from "./user";

/**
 * An attachment response.
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.7.0/#api/2/issue/\{issueIdOrKey\}/attachments-addAttachment
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post*
 */
export interface Attachment {
    /**
     * Details of the user who added the attachment.
     */
    author?: User;
    /**
     * The content of the attachment.
     */
    content?: string;
    /**
     * The datetime the attachment was created.
     */
    created?: DateTimeIso;
    /**
     * The file name of the attachment.
     */
    filename?: string;
    /**
     * The MIME type of the attachment.
     */
    mimeType?: string;
    /**
     * Extra properties of any type may be provided to this object.
     */
    properties?: Record<string, unknown>;
    /**
     * The URL of the attachment details response.
     */
    self?: string;
    /**
     * The size of the attachment.
     */
    size: number;
    /**
     * The URL of a thumbnail representing the attachment.
     */
    thumbnail?: string;
}
/**
 * An attachment response.
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post
 */
export interface AttachmentCloud extends Attachment {
    /**
     * The ID of the attachment.
     */
    id?: string;
}
