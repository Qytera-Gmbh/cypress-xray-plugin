import { FieldMetaCloud, FieldMetaServer } from "./fieldMeta";

type EditMeta<FieldMetaType> = {
    /**
     * A list of editable field details.
     */
    fields?: {
        [k: string]: FieldMetaType;
    };
};
export type EditMetaServer = EditMeta<FieldMetaServer>;
export type EditMetaCloud = EditMeta<FieldMetaCloud>;
