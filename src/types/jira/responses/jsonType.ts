export interface IJsonType {
    /**
     * The data type of the field.
     */
    type?: string;
    /**
     * When the data type is an array, the name of the field items within the array.
     */
    items?: string;
    /**
     * If the field is a system field, the name of the field.
     */
    system?: string;
    /**
     * If the field is a custom field, the URI of the field.
     */
    custom?: string;
    /**
     * If the field is a custom field, the custom ID of the field.
     */
    customId?: number;
}
export interface JsonTypeCloud extends IJsonType {
    /**
     * If the field is a custom field, the configuration of the field.
     */
    configuration?: Record<string, unknown>;
}
