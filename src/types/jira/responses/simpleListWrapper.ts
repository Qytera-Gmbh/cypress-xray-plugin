import { IGroup } from "./group";

export interface ISimpleListWrapper {
    size: number;
    "max-results"?: number;
    items?: IGroup[];
}
