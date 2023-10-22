import { IJsonType } from "./jsonType";
import { IScope } from "./scope";

export interface IFieldDetail {
    /**
     * The ID of the field.
     */
    id: string;
    /**
     * The name of the field.
     */
    name: string;
    /**
     * Whether the field is a custom field.
     */
    custom: boolean;
    /**
     * Whether the content of the field can be used to order lists.
     */
    orderable: boolean;
    /**
     * Whether the field can be used as a column on the issue navigator.
     */
    navigable: boolean;
    /**
     * Whether the content of the field can be searched.
     */
    searchable: boolean;
    /**
     * The names that can be used to reference the field in an advanced search.
     */
    clauseNames: string[];
    /**
     * The data schema for the field.
     */
    schema: IJsonType;
}
export interface FieldDetailCloud extends IFieldDetail {
    /**
     * The key of the field.
     */
    key?: string;
    /**
     * The scope of the field.
     */
    scope?: IScope;
}
