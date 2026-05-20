import type { ProjectDetails } from "./project-details";

/**
 * Details of the next-gen projects an issue type is available in.
 */
export interface Scope {
    /**
     * Extra properties of any type provided to this object.
     */
    [key: string]: unknown;
    /**
     * The project the item has scope in.
     */
    project?: ProjectDetails;
    /**
     * The type of scope.
     */
    type?: string;
}
