import { DateTimeISO } from "../../util";
import { IUser } from "./user";

export interface IAttachment {
    /**
     * The URL of the attachment details response.
     */
    self?: string;
    /**
     * The file name of the attachment.
     */
    filename?: string;
    /**
     * Details of the user who added the attachment.
     */
    author?: IUser;
    /**
     * The datetime the attachment was created.
     */
    created?: DateTimeISO;
    /**
     * The size of the attachment.
     */
    size: number;
    /**
     * The MIME type of the attachment.
     */
    mimeType?: string;
    /**
     * Extra properties of any type may be provided to this object.
     */
    properties?: {
        [k: string]: unknown;
    };
    /**
     * The content of the attachment.
     */
    content?: string;
    /**
     * The URL of a thumbnail representing the attachment.
     */
    thumbnail?: string;
}
/**
 * An attachment response.
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.7.0/#api/2/issue/\{issueIdOrKey\}/attachments-addAttachment
 */
export interface AttachmentServer extends IAttachment {}
/**
 * An attachment response.
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post
 */
export interface AttachmentCloud extends IAttachment {
    /**
     * The ID of the attachment.
     */
    id?: string;
}
