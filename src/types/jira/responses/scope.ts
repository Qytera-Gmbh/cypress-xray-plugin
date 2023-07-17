import { ProjectDetails } from "./projectDetails";

/**
 * Details of the next-gen projects an issue type is available in.
 */
export type Scope = {
    /**
     * The project the item has scope in.
     */
    project?: ProjectDetails;
    /**
     * The type of scope.
     */
    type?: string;
    /**
     * Extra properties of any type provided to this object.
     */
    [key: string]: unknown;
};
