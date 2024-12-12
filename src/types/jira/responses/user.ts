import type { SimpleListWrapper } from "./simple-list-wrapper";

export interface User {
    /**
     * Whether the user is active.
     */
    active: boolean;
    /**
     * The avatars of the user.
     */
    avatarUrls?: {
        ["16x16"]?: string;
        ["24x24"]?: string;
        ["32x32"]?: string;
        ["48x48"]?: string;
    };
    /**
     * The display name of the user. Depending on the user’s privacy settings, this may return an
     * alternative value.
     */
    displayName?: string;
    /**
     * The email address of the user. Depending on the user’s privacy settings, this may be returned
     * as null.
     */
    emailAddress?: string;
    /**
     * This property is no longer available and will be removed from the documentation soon. See the
     * {@link https://developer.atlassian.com/cloud/jira/platform/deprecation-notice-user-privacy-api-migration-guide/ | deprecation notice}
     * for details.
     */
    key?: string;
    /**
     * This property is no longer available and will be removed from the documentation soon. See the
     * {@link https://developer.atlassian.com/cloud/jira/platform/deprecation-notice-user-privacy-api-migration-guide/ | deprecation notice}
     * for details.
     */
    name?: string;
    /**
     * The URL of the user.
     */
    self?: string;
    /**
     * The time zone specified in the user's profile. Depending on the user’s privacy settings, this
     * may be returned as null.
     */
    timeZone?: string;
}
export interface UserServer extends User {
    applicationRoles?: SimpleListWrapper;
    deleted?: boolean;
    expand?: string;
    groups?: SimpleListWrapper;
    locale?: string;
}
export interface UserCloud extends User {
    /**
     * The account ID of the user, which uniquely identifies the user across all Atlassian products.
     * @example "5b10ac8d82e05b22cc7d4ef5"
     */
    accountId?: string;
    /**
     * The type of account represented by this user.
     */
    accountType?: "app" | "atlassian" | "customer";
}
