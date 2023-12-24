import { IProjectDetails } from "./projectDetails";

/**
 * Details of the next-gen projects an issue type is available in.
 */
export interface IScope {
    /**
     * Extra properties of any type provided to this object.
     */
    [key: string]: unknown;
    /**
     * The project the item has scope in.
     */
    project?: IProjectDetails;
    /**
     * The type of scope.
     */
    type?: string;
}
