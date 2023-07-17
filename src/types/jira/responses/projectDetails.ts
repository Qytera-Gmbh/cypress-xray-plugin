import { AvatarUrls } from "./avatarUrls";
import { UpdatedProjectCategory } from "./updatedProjectCategory";

/**
 * The project an item has scope in.
 */
export type ProjectDetails = {
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
    projectTypeKey?: "software" | "service_desk" | "business";
    /**
     * The URL of the project details.
     */
    self?: string;
    /**
     * Whether or not the project is simplified.
     */
    simplified?: boolean;
};
