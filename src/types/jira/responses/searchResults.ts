import { IssueCloud, IssueServer } from "./issue";
import { JsonTypeCloud, JsonTypeServer } from "./jsonType";

export type SearchResults<IssueType, JsonType> = {
    /**
     * Expand options that include additional search result details in the response.
     */
    expand?: string;
    /**
     * The index of the first item returned on the page.
     */
    startAt?: number;
    /**
     * The maximum number of results that could be on the page.
     */
    maxResults?: number;
    /**
     * The number of results on the page.
     */
    total?: number;
    /**
     * The list of issues found by the search.
     */
    issues?: IssueType[];
    /**
     * Any warnings related to the JQL query.
     */
    warningMessages?: string[];
    /**
     * The ID and name of each field in the search results.
     */
    names?: {
        [k: string]: string;
    };
    /**
     * The schema describing the field types in the search results.
     */
    schema?: {
        [k: string]: JsonType;
    };
};
/**
 * An issue search response.
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/search-searchUsingSearchRequest
 */
export type SearchResultsServer = SearchResults<IssueServer, JsonTypeServer>;
/**
 * An issue search response.
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-post
 */
export type SearchResultsCloud = SearchResults<IssueCloud, JsonTypeCloud>;
