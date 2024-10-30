import type { JsonType } from "./json-type";
import type { Scope } from "./scope";

export interface FieldDetail {
    /**
     * The names that can be used to reference the field in an advanced search.
     */
    clauseNames: string[];
    /**
     * Whether the field is a custom field.
     */
    custom: boolean;
    /**
     * The ID of the field.
     */
    id: string;
    /**
     * The name of the field.
     */
    name: string;
    /**
     * Whether the field can be used as a column on the issue navigator.
     */
    navigable: boolean;
    /**
     * Whether the content of the field can be used to order lists.
     */
    orderable: boolean;
    /**
     * The data schema for the field.
     */
    schema: JsonType;
    /**
     * Whether the content of the field can be searched.
     */
    searchable: boolean;
}
export interface FieldDetailCloud extends FieldDetail {
    /**
     * The key of the field.
     */
    key?: string;
    /**
     * The scope of the field.
     */
    scope?: Scope;
}
