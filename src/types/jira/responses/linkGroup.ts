import { SimpleLink } from "./simpleLink";

export type LinkGroup = {
    id?: string;
    styleClass?: string;
    /**
     * Details about the operations available in this version.
     */
    header?: SimpleLink;
    weight?: number;
    links?: SimpleLink[];
    groups?: LinkGroup[];
};
