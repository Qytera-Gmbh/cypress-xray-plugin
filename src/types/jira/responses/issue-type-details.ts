import type { Scope } from "./scope";

/**
 * An issue type visible to the Jira user.
 */
export interface IssueTypeDetails {
    /**
     * The ID of the issue type's avatar.
     */
    avatarId?: number;
    /**
     * The description of the issue type.
     */
    description?: string;
    /**
     * The URL of the issue type's avatar.
     */
    iconUrl?: string;
    /**
     * The ID of the issue type.
     */
    id?: string;
    /**
     * The name of the issue type.
     */
    name?: string;
    /**
     * The URL of these issue type details.
     */
    self?: string;
    /**
     * Whether this issue type is used to create subtasks.
     */
    subtask?: boolean;
}

export interface IssueTypeDetailsCloud extends IssueTypeDetails {
    /**
     * Unique ID for next-gen projects.
     */
    entityId?: string;
    /**
     * Hierarchy level of the issue type.
     */
    hierarchyLevel?: number;
    /**
     * Details of the next-gen projects the issue type is available in.
     */
    scope?: Scope;
    /**
     * The untranslated name of the issue type
     * ([currently undocumented](https://community.developer.atlassian.com/t/untranslatedname-property-returned-within-the-issue-types-api-response/46934)).
     */
    untranslatedName?: string;
}
