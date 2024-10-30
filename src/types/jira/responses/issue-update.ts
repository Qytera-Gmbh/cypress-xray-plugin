import type { EntityProperty } from "./entity-property";
import type { FieldUpdateOperation } from "./field-update-operation";
import type { HistoryMetadata } from "./history-metadata";
import type { IssueTransition } from "./issue-transition";
import type { IssueTypeDetails } from "./issue-type-details";

/**
 * Payload when creating or updating Jira issues.
 *
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
 * @see https://developer.atlassian.com/server/jira/platform/rest/v10000/api-group-issue/#api-api-2-issue-post
 */
export interface IssueUpdate {
    /**
     * List of issue screen fields to update, specifying the sub-field to update and its value for
     * each field. This field provides a straightforward option when setting a sub-field. When
     * multiple sub-fields or other operations are required, use {@link update}. Fields included in
     * here cannot be included in {@link update}.
     */
    fields?: {
        [id: string]: unknown;
        /**
         * The issue description.
         */
        description?: string;
        /**
         * The issue type.
         */
        issuetype?: IssueTypeDetails;
        /**
         * The issue summary.
         */
        summary?: string;
    };
    /**
     * Additional issue history details.
     */
    historyMetadata?: HistoryMetadata;
    /**
     * Details of issue properties to add or update.
     */
    properties?: EntityProperty[];
    /**
     * Details of a transition. Required when performing a transition, optional when creating or
     * editing an issue.
     */
    transition?: IssueTransition;
    /**
     * A Map containing the field field name and a list of operations to perform on the issue screen
     * field. Note that fields included in here cannot be included in {@link fields}.
     */
    update?: Record<string, FieldUpdateOperation[]>;
}
