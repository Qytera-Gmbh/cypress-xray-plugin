import type { Changelog } from "./changelog";
import type { EditMeta } from "./edit-meta";
import type { IncludedFields } from "./included-fields";
import type { JsonType } from "./json-type";
import type { Opsbar } from "./opsbar";
import type { Properties } from "./properties";
import type { Transition } from "./transition";

export interface Issue {
    /**
     * Details of changelogs associated with the issue.
     */
    changelog?: Changelog;
    /**
     * The metadata for the fields on the issue that can be amended.
     */
    editmeta?: EditMeta;
    /**
     * Expand options that include additional issue details in the response.
     */
    expand?: string;
    /**
     * The fields returned for the issue.
     */
    fields?: Record<string, unknown>;
    /**
     * The parsed and queried fields or similar query parameters.
     */
    fieldsToInclude?: IncludedFields;
    /**
     * The ID of the issue.
     */
    id?: string;
    /**
     * The key of the issue.
     */
    key?: string;
    /**
     * The ID and name of each field present on the issue.
     */
    names?: Record<string, string>;
    /**
     * The operations that can be performed on the issue.
     */
    operations?: Opsbar;
    /**
     * Details of the issue properties identified in the request.
     */
    properties?: Properties;
    /**
     * The rendered value of each field present on the issue.
     */
    renderedFields?: Record<string, unknown>;
    /**
     * The schema describing each field present on the issue.
     */
    schema?: Record<string, JsonType>;
    /**
     * The URL of the issue details.
     */
    self?: string;
    /**
     * The transitions that can be performed on the issue.
     */
    transitions?: Transition[];
    /**
     * The versions of each field on the issue.
     */
    versionedRepresentations?: Record<string, Record<string, unknown>>;
}
