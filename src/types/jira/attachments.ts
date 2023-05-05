import { DateTimeISO } from "../util";
/**
 * An attachment response.
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.7.0/#api/2/issue/{issueIdOrKey}/attachments-addAttachment
 */
export type Attachment = {
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
    author?: User;
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
};
export type AttachmentServer = Attachment;
export type AttachmentCloud = Attachment & {
    /**
     * The ID of the attachment.
     */
    id?: string;
};

export type User = {
    /**
     * The URL of the user.
     */
    self?: string;
    /**
     * This property is no longer available and will be removed from the
     * documentation soon. See the {@link https://developer.atlassian.com/cloud/jira/platform/deprecation-notice-user-privacy-api-migration-guide/ deprecation notice}
     * for details.
     */
    key?: string;
    /**
     * This property is no longer available and will be removed from the
     * documentation soon. See the {@link https://developer.atlassian.com/cloud/jira/platform/deprecation-notice-user-privacy-api-migration-guide/ deprecation notice}
     * for details.
     */
    name?: string;
    /**
     * The email address of the user. Depending on the user’s privacy settings,
     * this may be returned as null.
     */
    emailAddress?: string;
    /**
     * The avatars of the user.
     */
    avatarUrls?: {
        "16x16"?: string;
        "24x24"?: string;
        "32x32"?: string;
        "48x48"?: string;
    };
    /**
     * The display name of the user. Depending on the user’s privacy settings,
     * this may return an alternative value.
     */
    displayName?: string;
    /**
     * Whether the user is active.
     */
    active: boolean;
    /**
     * The time zone specified in the user's profile. Depending on the user’s privacy settings, this may be returned as null.
     */
    timeZone?: string;
};
export type UserServer = User & {
    locale?: string;
    groups?: SimpleListWrapper;
    applicationRoles?: SimpleListWrapper;
    expand?: string;
    deleted?: boolean;
};
export type UserCloud = User & {
    /**
     * The account ID of the user, which uniquely identifies the user across
     * all Atlassian products.
     * @example "5b10ac8d82e05b22cc7d4ef5"
     */
    accountId?: string;
    /**
     * The type of account represented by this user.
     */
    accountType?: "atlassian" | "app" | "customer";
};

export interface SimpleListWrapper {
    size: number;
    "max-results"?: number;
    items?: Group[];
}
export interface Group {
    name?: string;
    self?: string;
}
