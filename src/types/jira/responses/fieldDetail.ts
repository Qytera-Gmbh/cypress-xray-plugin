import { JsonTypeCloud, JsonTypeServer } from "./jsonType";
import { Scope } from "./scope";

type FieldDetail<JsonType> = {
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
    schema: JsonType;
};
export type FieldDetailServer = FieldDetail<JsonTypeServer>;
export type FieldDetailCloud = FieldDetail<JsonTypeCloud> & {
    /**
     * The key of the field.
     */
    key?: string;
    /**
     * The scope of the field.
     */
    scope?: Scope;
};
