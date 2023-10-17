export interface IChangeItem {
    /**
     * The name of the field changed.
     */
    field?: string;
    /**
     * The type of the field changed.
     */
    fieldtype?: string;
    /**
     * The details of the original value.
     */
    from?: string;
    /**
     * The details of the original value as a string.
     */
    fromString?: string;
    /**
     * The details of the new value.
     */
    to?: string;
    /**
     * The details of the new value as a string.
     */
    toString?: string;
}
