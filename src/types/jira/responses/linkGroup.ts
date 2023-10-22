import { ISimpleLink } from "./simpleLink";

export interface ILinkGroup {
    id?: string;
    styleClass?: string;
    /**
     * Details about the operations available in this version.
     */
    header?: ISimpleLink;
    weight?: number;
    links?: ISimpleLink[];
    groups?: ILinkGroup[];
}
