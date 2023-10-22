import { IEntityProperty } from "./entityProperty";
import { IFieldUpdateOperation } from "./fieldUpdateOperation";
import { IHistoryMetadata } from "./historyMetadata";
import { IIssueTransition } from "./issueTransition";

export interface IIssueUpdate {
    /**
     * Details of a transition. Required when performing a transition, optional when creating or
     * editing an issue.
     */
    transition?: IIssueTransition;
    /**
     * List of issue screen fields to update, specifying the sub-field to update and its value for
     * each field. This field provides a straightforward option when setting a sub-field. When
     * multiple sub-fields or other operations are required, use {@link update}. Fields included in
     * here cannot be included in {@link update}.
     */
    fields?: {
        /**
         * Fields to set and the values to set them to.
         */
        [k: string]: unknown;
    };
    /**
     * A Map containing the field field name and a list of operations to perform on the issue screen
     * field. Note that fields included in here cannot be included in {@link fields}.
     */
    update?: {
        [k: string]: IFieldUpdateOperation[];
    };
    /**
     * Additional issue history details.
     */
    historyMetadata?: IHistoryMetadata;
    /**
     * Details of issue properties to be add or update.
     */
    properties?: IEntityProperty[];
}
