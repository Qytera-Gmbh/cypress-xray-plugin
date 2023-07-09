import { OneOf } from "../../util";
import { JsonTypeCloud, JsonTypeServer } from "./jsonType";

type FieldMeta<J extends OneOf<[JsonTypeServer, JsonTypeCloud]>> = {
    /**
     * Whether the field is required.
     */
    required: boolean;
    /**
     * The data type of the field.
     */
    schema?: J;
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
};
export type FieldMetaServer = FieldMeta<JsonTypeServer> & {
    fieldId?: string;
};
export type FieldMetaCloud = FieldMeta<JsonTypeCloud> & {
    /**
     * The configuration properties.
     */
    configuration?: {
        [k: string]: unknown;
    };
};
