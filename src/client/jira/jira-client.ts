import type { SearchRequest } from "../../models/jira/requests/search";
import type { Attachment } from "../../models/jira/responses/attachment";
import type { FieldDetail } from "../../models/jira/responses/field-detail";
import type { Issue } from "../../models/jira/responses/issue";
import type { IssueTypeDetails } from "../../models/jira/responses/issue-type-details";
import type { IssueUpdate } from "../../models/jira/responses/issue-update";
import type { User } from "../../models/jira/responses/user";

/**
 * Search endpoint of Jira clients.
 */
export interface HasSearchEndpoint {
    /**
     * Searches for issues using JQL. Automatically performs pagination if necessary.
     *
     * @param request - the search request
     * @returns the search results
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/search-searchUsingSearchRequest
     */
    search(request: SearchRequest): Promise<Issue[]>;
}

/**
 * Add attachment endpoint of Jira clients.
 */
export interface HasAddAttachmentEndpoint {
    /**
     * Adds one or more attachments to an issue. Attachments are posted as multipart/form-data.
     *
     * @param issueIdOrKey - issueIdOrKey the ID or key of the issue that attachments are added to
     * @param files - files the files to attach
     * @returns a list of issue attachment responses
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.7.0/#api/2/issue/\{issueIdOrKey\}/attachments-addAttachment
     */
    addAttachment(issueIdOrKey: string, ...files: string[]): Promise<Attachment[]>;
}

/**
 * Edit issue endpoint of Jira clients.
 */
export interface HasEditIssueEndpoint {
    /**
     * Edits an issue. A transition may be applied and issue properties updated as part of the edit.
     * The edits to the issue's fields are defined using `update` and `fields`.
     *
     * The parent field may be set by key or ID. For standard issue types, the parent may be removed
     * by setting `update.parent.set.none` to `true`.
     *
     * @param issueIdOrKey - the ID or key of the issue
     * @param issueUpdateData - the edit data
     * @returns the ID or key of the edited issue
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.10.0/#api/2/issue-editIssue
     */
    editIssue(issueIdOrKey: string, issueUpdateData: IssueUpdate): Promise<string>;
}

/**
 * Get fields endpoint of Jira clients.
 */
export interface HasGetFieldsEndpoint {
    /**
     * Returns system and custom issue fields according to the following rules:
     * - Fields that cannot be added to the issue navigator are always returned
     * - Fields that cannot be placed on an issue screen are always returned
     * - Fields that depend on global Jira settings are only returned if the setting is enabled
     *   That is, timetracking fields, subtasks, votes, and watches
     * - For all other fields, this operation only returns the fields that the user has permission
     *   to view (that is, the field is used in at least one project that the user has *Browse
     *   Projects* project permission for)
     *
     * @returns the fields
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/field-getFields
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-fields/#api-rest-api-3-field-get
     */
    getFields(): Promise<FieldDetail[]>;
}

/**
 * Get issue types endpoint of Jira clients.
 */
export interface HasGetIssueTypesEndpoint {
    /**
     * Returns all issue types.
     *
     * @returns the issue types
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/issuetype-getIssueAllTypes
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-types/#api-rest-api-3-issuetype-get
     */
    getIssueTypes(): Promise<IssueTypeDetails[]>;
}

/**
 * Transition issue endpoint of Jira clients.
 */
export interface HasTransitionIssueEndpoint {
    /**
     * Performs an issue transition and, if the transition has a screen, updates the fields from the
     * transition screen.
     *
     * To update the fields on the transition screen, specify the fields in the `fields` or `update`
     * parameters in the request body. Get details about the fields using
     * [Get transitions](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-transitions-get)
     * with the `transitions.fields` expand.
     *
     * @param issueIdOrKey - the ID or key of the issue
     * @param issueUpdateData - the issue update data
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-transitions-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/issue-doTransition
     */
    transitionIssue(issueIdOrKey: string, issueUpdateData: IssueUpdate): Promise<void>;
}

/**
 * Myself endpoint of Jira clients.
 */
export interface HasMyselfEndpoint {
    /**
     * Returns details for the current user.
     *
     * @returns the user details
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-myself/#api-rest-api-3-myself-get
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.11.0/#api/2/myself
     */
    getMyself(): Promise<User>;
}
