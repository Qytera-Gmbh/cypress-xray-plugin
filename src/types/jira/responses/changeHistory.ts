import { ChangeItem } from "./changeItem";
import { HistoryMetadata } from "./historyMetadata";
import { UserCloud, UserServer } from "./user";

type ChangeHistory<UserType> = {
    /**
     * The ID of the changelog.
     */
    id?: string;
    /**
     * The user who made the change.
     */
    author?: UserType;
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
};
export type ChangeHistoryServer = ChangeHistory<UserServer>;
export type ChangeHistoryCloud = ChangeHistory<UserCloud>;
