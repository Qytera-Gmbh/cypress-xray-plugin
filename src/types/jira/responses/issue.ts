import { ChangelogCloud, ChangelogServer } from "./changelog";
import { EditMetaCloud, EditMetaServer } from "./editMeta";
import { IncludedFields } from "./includedFields";
import { JsonTypeCloud, JsonTypeServer } from "./jsonType";
import { Opsbar } from "./opsbar";
import { Properties } from "./properties";
import { TransitionCloud, TransitionServer } from "./transition";

export interface IIssue<ChangelogType, EditMetaType, JsonType, TransitionType> {
    /**
     * Expand options that include additional issue details in the response.
     */
    expand?: string;
    /**
     * The ID of the issue.
     */
    id?: string;
    /**
     * The URL of the issue details.
     */
    self?: string;
    /**
     * The key of the issue.
     */
    key?: string;
    /**
     * The fields returned for the issue.
     */
    fields?: {
        [k: string]: unknown;
    };
    /**
     * The rendered value of each field present on the issue.
     */
    renderedFields?: {
        [k: string]: unknown;
    };
    /**
     * Details of the issue properties identified in the request.
     */
    properties?: Properties;
    /**
     * The ID and name of each field present on the issue.
     */
    names?: {
        [k: string]: string;
    };
    /**
     * The schema describing each field present on the issue.
     */
    schema?: {
        [k: string]: JsonType;
    };
    /**
     * The transitions that can be performed on the issue.
     */
    transitions?: TransitionType[];
    /**
     * The operations that can be performed on the issue.
     */
    operations?: Opsbar;
    /**
     * The metadata for the fields on the issue that can be amended.
     */
    editmeta?: EditMetaType;
    /**
     * Details of changelogs associated with the issue.
     */
    changelog?: ChangelogType;
    /**
     * The versions of each field on the issue.
     */
    versionedRepresentations?: {
        [k: string]: {
            [k: string]: unknown;
        };
    };
    /**
     * The parsed and queried fields or similar query parameters.
     */
    fieldsToInclude?: IncludedFields;
}
export type IssueServer = IIssue<ChangelogServer, EditMetaServer, JsonTypeServer, TransitionServer>;
export type IssueCloud = IIssue<ChangelogCloud, EditMetaCloud, JsonTypeCloud, TransitionCloud>;
