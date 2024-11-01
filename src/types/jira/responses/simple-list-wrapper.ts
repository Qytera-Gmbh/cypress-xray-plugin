import type { Group } from "./group";

export interface SimpleListWrapper {
    items?: Group[];
    ["max-results"]?: number;
    size: number;
}
