import type { AvatarUrls } from "./avatar-urls";
import type { UpdatedProjectCategory } from "./updated-project-category";

/**
 * The project an item has scope in.
 */
export interface ProjectDetails {
    /**
     * The URLs of the project's avatars.
     */
    avatarUrls?: AvatarUrls;
    /**
     * The ID of the project.
     */
    id?: string;
    /**
     * The key of the project.
     */
    key?: string;
    /**
     * The name of the project.
     */
    name?: string;
    /**
     * The category the project belongs to.
     */
    projectCategory?: UpdatedProjectCategory;
    /**
     * The project type of the project.
     */
    projectTypeKey?: "business" | "service_desk" | "software";
    /**
     * The URL of the project details.
     */
    self?: string;
    /**
     * Whether or not the project is simplified.
     */
    simplified?: boolean;
}
