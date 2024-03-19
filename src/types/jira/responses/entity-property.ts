export interface EntityProperty {
    /**
     * The key of the property. Required on create and update.
     */
    key: string;
    /**
     * The value of the property. Required on create and update.
     */
    value: unknown;
}
