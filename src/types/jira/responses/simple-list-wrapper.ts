import { Group } from "./group";

export interface SimpleListWrapper {
    size: number;
    ["max-results"]?: number;
    items?: Group[];
}
