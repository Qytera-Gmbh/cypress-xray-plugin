import type { FieldMeta } from "./field-meta";
import type { StatusDetails } from "./status-details";

/**
 * Models the payload when transitioning an issue from one status to another.
 */
export interface IssueTransition {
    /**
     * Details of the fields associated with the issue transition screen. Use this information to
     * populate `fields` and `update` in a transition request.
     */
    fields?: Record<string, FieldMeta>;
    /**
     * The ID of the issue transition. Required when specifying a transition to undertake.
     */
    id?: string;
    /**
     * The name of the issue transition.
     */
    name?: string;
    /**
     * Details of the issue status after the transition.
     */
    to?: StatusDetails;
}
export interface IssueTransitionServer extends IssueTransition {
    opsbarSequence?: number;
}
export interface IssueTransitionCloud extends IssueTransition {
    /**
     * Expand options that include additional transition details in the response.
     */
    expand?: string;
    /**
     * Whether there is a screen associated with the issue transition.
     */
    hasScreen?: boolean;
    /**
     * Whether the transition is available to be performed.
     */
    isAvailable?: boolean;
    /**
     * Whether the issue has to meet criteria before the issue transition is applied.
     */
    isConditional?: boolean;
    /**
     * Whether the issue transition is global, that is, the transition is applied to issues
     * regardless of their status.
     */
    isGlobal?: boolean;
    /**
     * Whether this is the initial issue transition for the workflow.
     */
    isInitial?: boolean;
    looped?: boolean;
}
