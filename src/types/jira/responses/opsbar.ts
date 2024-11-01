import type { LinkGroup } from "./link-group.js";

export interface Opsbar {
    /**
     * Details of the link groups defining issue operations.
     */
    linkGroups?: LinkGroup[];
}
