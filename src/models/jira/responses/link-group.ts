import type { SimpleLink } from "./simple-link";

export interface LinkGroup {
    groups?: LinkGroup[];
    /**
     * Details about the operations available in this version.
     */
    header?: SimpleLink;
    id?: string;
    links?: SimpleLink[];
    styleClass?: string;
    weight?: number;
}
