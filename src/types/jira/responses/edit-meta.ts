import type { FieldMeta } from "./field-meta";

export interface EditMeta {
    /**
     * A list of editable field details.
     */
    fields?: Record<string, FieldMeta>;
}
