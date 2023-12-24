import { EntityProperty } from "./entityProperty";
import { FieldUpdateOperation } from "./fieldUpdateOperation";
import { HistoryMetadata } from "./historyMetadata";
import { IssueTransition } from "./issueTransition";

export interface IssueUpdate {
    /**
     * Details of a transition. Required when performing a transition, optional when creating or
     * editing an issue.
     */
    transition?: IssueTransition;
    /**
     * List of issue screen fields to update, specifying the sub-field to update and its value for
     * each field. This field provides a straightforward option when setting a sub-field. When
     * multiple sub-fields or other operations are required, use {@link update}. Fields included in
     * here cannot be included in {@link update}.
     */
    fields?: Record<string, unknown>;
    /**
     * A Map containing the field field name and a list of operations to perform on the issue screen
     * field. Note that fields included in here cannot be included in {@link fields}.
     */
    update?: Record<string, FieldUpdateOperation[]>;
    /**
     * Additional issue history details.
     */
    historyMetadata?: HistoryMetadata;
    /**
     * Details of issue properties to be add or update.
     */
    properties?: EntityProperty[];
}
