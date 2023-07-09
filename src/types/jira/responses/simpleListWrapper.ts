import { Group } from "./group";

export type SimpleListWrapper = {
    size: number;
    "max-results"?: number;
    items?: Group[];
};
