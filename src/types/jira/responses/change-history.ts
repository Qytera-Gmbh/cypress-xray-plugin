import { ChangeItem } from "./change-item";
import { HistoryMetadata } from "./history-metadata";
import { User } from "./user";

export interface ChangeHistory {
    /**
     * The ID of the changelog.
     */
    id?: string;
    /**
     * The user who made the change.
     */
    author?: User;
    /**
     * The date on which the change took place.
     */
    created?: string;
    /**
     * The list of items changed.
     */
    items?: ChangeItem[];
    /**
     * The history metadata associated with the changed.
     */
    historyMetadata?: HistoryMetadata;
}
