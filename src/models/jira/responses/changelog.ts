import type { ChangeHistory } from "./change-history";

export interface Changelog {
    /**
     * The list of changelogs.
     */
    histories?: ChangeHistory[];
    /**
     * The maximum number of results that could be on the page.
     */
    maxResults?: number;
    /**
     * The index of the first item returned on the page.
     */
    startAt?: number;
    /**
     * The number of results on the page.
     */
    total?: number;
}
