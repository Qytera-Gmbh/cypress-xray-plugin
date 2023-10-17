import { IChangeItem } from "./changeItem";
import { IHistoryMetadata } from "./historyMetadata";
import { IUser } from "./user";

export interface IChangeHistory {
    /**
     * The ID of the changelog.
     */
    id?: string;
    /**
     * The user who made the change.
     */
    author?: IUser;
    /**
     * The date on which the change took place.
     */
    created?: string;
    /**
     * The list of items changed.
     */
    items?: IChangeItem[];
    /**
     * The history metadata associated with the changed.
     */
    historyMetadata?: IHistoryMetadata;
}
