export type HistoryMetadataParticipant = {
    id?: string;
    /**
     * The display name of the user or system associated with a history record.
     */
    displayName?: string;
    /**
     * The key of the display name of the user or system associated with a history record.
     */
    displayNameKey?: string;
    /**
     * The type of the user or system associated with a history record.
     */
    type?: string;
    /**
     * The URL to an avatar for the user or system associated with a history record.
     */
    avatarUrl?: string;
    /**
     * The URL of the user or system associated with a history record.
     */
    url?: string;
};
