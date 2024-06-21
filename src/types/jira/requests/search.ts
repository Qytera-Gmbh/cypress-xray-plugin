/**
 * An issue search request.
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-post
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/search-searchUsingSearchRequest
 */
export interface SearchRequest {
    /**
     * A list of fields to return for each issue, use it to retrieve a subset of fields. This
     * parameter accepts a comma-separated list. Expand options include:
     * - `*all` returns all fields
     * - `*navigable` returns navigable fields
     * - any issue field, prefixed with a minus to exclude
     *
     * The default is `*navigable`.
     */
    fields?: string[];
    /**
     * A JQL expression.
     */
    jql?: string;
    /**
     * The maximum number of items to return per page.
     */
    maxResults?: number;
    /**
     * The index of the first item to return in the page of results (page offset). The base index is
     * `0`.
     */
    startAt?: number;
}
export interface SearchRequestServer extends SearchRequest {
    /**
     * Determines how to validate the JQL query and treat the validation results. Supported values:
     * - `true` returns a 400 response code if any errors are found, along with a list of all
     * errors (and warnings)
     * - `false` returns all errors as warnings
     *
     * The default is `true`.
     */
    validateQuery?: boolean;
}
export interface SearchRequestCloud extends SearchRequest {
    /**
     * Use expand to include additional information about issues in the response. Note that, unlike
     * the majority of instances where `expand` is specified, `expand` is defined as a list of
     * values. The expand options are:
     * - `renderedFields` returns field values rendered in HTML format
     * - `names` returns the display name of each field
     * - `schema` returns the schema describing a field type
     * - `transitions` returns all possible transitions for the issue
     * - `operations` returns all possible operations for the issue
     * - `editmeta` returns information about how each field can be edited
     * - `changelog` returns a list of recent updates to an issue, sorted by date, starting from the
     * most recent
     * - `versionedRepresentations` instead of `fields`, returns `versionedRepresentations` a JSON
     * array containing each version of a field's value, with the highest numbered item representing
     *  the most recent version
     */
    expand?: string[];
    /**
     * Reference fields by their key (rather than ID). The default is `false`.
     */
    fieldsByKeys?: boolean;
    /**
     * A list of up to 5 issue properties to include in the results. This parameter accepts a
     * comma-separated list.
     */
    properties?: readonly [string?, string?, string?, string?, string?] | string;
    /**
     * Determines how to validate the JQL query and treat the validation results. Supported values:
     * - `strict` returns a 400 response code if any errors are found, along with a list of all
     *  errors (and warnings)
     * - `warn` returns all errors as warnings
     * - `none` no validation is performed
     *
     * The default is `strict`.
     */
    validateQuery?: "none" | "strict" | "warn";
}
