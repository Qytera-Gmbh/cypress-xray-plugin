import type { Group } from "./group.js";

export interface SimpleListWrapper {
    items?: Group[];
    ["max-results"]?: number;
    size: number;
}
