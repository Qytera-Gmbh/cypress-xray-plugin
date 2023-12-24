import { IChangelog } from "./changelog";
import { IEditMeta } from "./editMeta";
import { IIncludedFields } from "./includedFields";
import { IJsonType } from "./jsonType";
import { IOpsbar } from "./opsbar";
import { IProperties } from "./properties";
import { ITransition } from "./transition";

export interface IIssue {
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
    properties?: IProperties;
    /**
     * The ID and name of each field present on the issue.
     */
    names?: Record<string, string>;
    /**
     * The schema describing each field present on the issue.
     */
    schema?: Record<string, IJsonType>;
    /**
     * The transitions that can be performed on the issue.
     */
    transitions?: ITransition[];
    /**
     * The operations that can be performed on the issue.
     */
    operations?: IOpsbar;
    /**
     * The metadata for the fields on the issue that can be amended.
     */
    editmeta?: IEditMeta;
    /**
     * Details of changelogs associated with the issue.
     */
    changelog?: IChangelog;
    /**
     * The versions of each field on the issue.
     */
    versionedRepresentations?: Record<string, Record<string, unknown>>;
    /**
     * The parsed and queried fields or similar query parameters.
     */
    fieldsToInclude?: IIncludedFields;
}
