import { Changelog } from "./changelog";
import { EditMeta } from "./editMeta";
import { IncludedFields } from "./includedFields";
import { JsonType } from "./jsonType";
import { Opsbar } from "./opsbar";
import { Properties } from "./properties";
import { Transition } from "./transition";

export interface Issue {
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
    fields?: Record<string, unknown>;
    /**
     * The rendered value of each field present on the issue.
     */
    renderedFields?: Record<string, unknown>;
    /**
     * Details of the issue properties identified in the request.
     */
    properties?: Properties;
    /**
     * The ID and name of each field present on the issue.
     */
    names?: Record<string, string>;
    /**
     * The schema describing each field present on the issue.
     */
    schema?: Record<string, JsonType>;
    /**
     * The transitions that can be performed on the issue.
     */
    transitions?: Transition[];
    /**
     * The operations that can be performed on the issue.
     */
    operations?: Opsbar;
    /**
     * The metadata for the fields on the issue that can be amended.
     */
    editmeta?: EditMeta;
    /**
     * Details of changelogs associated with the issue.
     */
    changelog?: Changelog;
    /**
     * The versions of each field on the issue.
     */
    versionedRepresentations?: Record<string, Record<string, unknown>>;
    /**
     * The parsed and queried fields or similar query parameters.
     */
    fieldsToInclude?: IncludedFields;
}
