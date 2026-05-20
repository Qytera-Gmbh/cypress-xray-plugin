export interface FieldUpdateOperation {
    /**
     * The value to add to the field.
     */
    add?: unknown;
    /**
     * The field value to copy from another issue.
     */
    copy?: unknown;
    /**
     * The value to edit in the field.
     */
    edit?: unknown;
    /**
     * The value to removed from the field.
     */
    remove?: unknown;
    /**
     * The value to set in the field.
     */
    set?: unknown;
}
