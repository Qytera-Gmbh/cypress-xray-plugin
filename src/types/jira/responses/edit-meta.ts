import type { FieldMeta } from "./field-meta.js";

export interface EditMeta {
    /**
     * A list of editable field details.
     */
    fields?: Record<string, FieldMeta>;
}
