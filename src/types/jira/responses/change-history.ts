import type { ChangeItem } from "./change-item";
import type { HistoryMetadata } from "./history-metadata";
import type { User } from "./user";

export interface ChangeHistory {
    /**
     * The user who made the change.
     */
    author?: User;
    /**
     * The date on which the change took place.
     */
    created?: string;
    /**
     * The history metadata associated with the changed.
     */
    historyMetadata?: HistoryMetadata;
    /**
     * The ID of the changelog.
     */
    id?: string;
    /**
     * The list of items changed.
     */
    items?: ChangeItem[];
}
