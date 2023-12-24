import { JsonType } from "./jsonType";

export interface FieldMeta {
    /**
     * Whether the field is required.
     */
    required: boolean;
    /**
     * The data type of the field.
     */
    schema?: JsonType;
    /**
     * The name of the field.
     */
    name?: string;
    /**
     * The URL that can be used to automatically complete the field.
     */
    autoCompleteUrl?: string;
    /**
     * Whether the field has a default value.
     */
    hasDefaultValue?: boolean;
    /**
     * The list of operations that can be performed on the field.
     */
    operations?: string[];
    /**
     * The list of values allowed in the field.
     */
    allowedValues?: unknown[];
    /**
     * The default value of the field.
     */
    defaultValue?: unknown;
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
