import { FieldMeta } from "./fieldMeta";

export interface EditMeta {
    /**
     * A list of editable field details.
     */
    fields?: Record<string, FieldMeta>;
}
