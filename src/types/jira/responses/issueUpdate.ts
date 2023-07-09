import { OneOf } from "../../util";
import { EntityProperty } from "./entityProperty";
import { FieldUpdateOperation } from "./fieldUpdateOperation";
import { HistoryMetadata } from "./historyMetadata";
import { IssueTransitionCloud, IssueTransitionServer } from "./issueTransition";
import { IssueTypeDetailsCloud, IssueTypeDetailsServer } from "./issueTypeDetails";

type IssueUpdate<
    IssueTransitionType extends OneOf<[IssueTransitionServer, IssueTransitionCloud]>,
    IssueTypeFieldType extends OneOf<[IssueTypeDetailsServer, IssueTypeDetailsCloud]>
> = {
    /**
     * Details of a transition. Required when performing a transition, optional when creating or
     * editing an issue.
     */
    transition?: IssueTransitionType;
    /**
     * List of issue screen fields to update, specifying the sub-field to update and its value for
     * each field. This field provides a straightforward option when setting a sub-field. When
     * multiple sub-fields or other operations are required, use {@link update}. Fields included in
     * here cannot be included in {@link update}.
     */
    fields?: {
        issueType?: IssueTypeFieldType;
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
        [k: string]: FieldUpdateOperation[];
    };
    /**
     * Additional issue history details.
     */
    historyMetadata?: HistoryMetadata;
    /**
     * Details of issue properties to be add or update.
     */
    properties?: EntityProperty[];
};
export type IssueUpdateServer = IssueUpdate<IssueTransitionServer, IssueTypeDetailsServer>;
export type IssueUpdateCloud = IssueUpdate<IssueTransitionCloud, IssueTypeDetailsCloud>;
