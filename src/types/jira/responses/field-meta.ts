import type { JsonType } from "./json-type";

export interface FieldMeta {
    /**
     * The list of values allowed in the field.
     */
    allowedValues?: unknown[];
    /**
     * The URL that can be used to automatically complete the field.
     */
    autoCompleteUrl?: string;
    /**
     * The default value of the field.
     */
    defaultValue?: unknown;
    /**
     * Whether the field has a default value.
     */
    hasDefaultValue?: boolean;
    /**
     * The name of the field.
     */
    name?: string;
    /**
     * The list of operations that can be performed on the field.
     */
    operations?: string[];
    /**
     * Whether the field is required.
     */
    required: boolean;
    /**
     * The data type of the field.
     */
    schema?: JsonType;
}
export interface FieldMetaServer extends FieldMeta {
    fieldId?: string;
}
export interface FieldMetaCloud extends FieldMeta {
    /**
     * The configuration properties.
     */
    configuration?: Record<string, unknown>;
}
