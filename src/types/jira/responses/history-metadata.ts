import type { HistoryMetadataParticipant } from "./history-metadata-participant";

/**
 * History metadata associated with a changelog.
 */
export interface HistoryMetadata {
    /**
     * The activity described in the history record.
     */
    activityDescription?: string;
    /**
     * The key of the activity described in the history record.
     */
    activityDescriptionKey?: string;
    /**
     * Details of the user whose action created the history record.
     */
    actor?: HistoryMetadataParticipant;
    /**
     * Details of the cause that triggered the creation the history record.
     */
    cause?: HistoryMetadataParticipant;
    /**
     * The description of the history record.
     */
    description?: string;
    /**
     * The description key of the history record.
     */
    descriptionKey?: string;
    /**
     * The description of the email address associated the history record.
     */
    emailDescription?: string;
    /**
     * The description key of the email address associated the history record.
     */
    emailDescriptionKey?: string;
    /**
     * Additional arbitrary information about the history record.
     */
    extraData?: Record<string, string>;
    /**
     * Details of the system that generated the history record.
     */
    generator?: HistoryMetadataParticipant;
    /**
     * The type of the history record.
     */
    type?: string;
}
