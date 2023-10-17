import { IFieldMeta } from "./fieldMeta";

export interface IEditMeta {
    /**
     * A list of editable field details.
     */
    fields?: {
        [k: string]: IFieldMeta;
    };
}
