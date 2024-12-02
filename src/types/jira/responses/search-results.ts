import type { Issue } from "./issue";
import type { JsonType } from "./json-type";

/**
 * An issue search response.
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/search-searchUsingSearchRequest
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-post
 */
export interface SearchResults {
    /**
     * Expand options that include additional search result details in the response.
     */
    expand?: string;
    /**
     * The list of issues found by the search.
     */
    issues?: Issue[];
    /**
     * The maximum number of results that could be on the page.
     */
    maxResults?: number;
    /**
     * The ID and name of each field in the search results.
     */
    names?: Record<string, string>;
    /**
     * The schema describing the field types in the search results.
     */
    schema?: Record<string, JsonType>;
    /**
     * The index of the first item returned on the page.
     */
    startAt?: number;
    /**
     * The number of results on the page.
     */
    total?: number;
    /**
     * Any warnings related to the JQL query.
     */
    warningMessages?: string[];
}
