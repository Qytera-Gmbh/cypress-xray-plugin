import { SimpleLink } from "./simple-link";

export interface LinkGroup {
    id?: string;
    styleClass?: string;
    /**
     * Details about the operations available in this version.
     */
    header?: SimpleLink;
    weight?: number;
    links?: SimpleLink[];
    groups?: LinkGroup[];
}
