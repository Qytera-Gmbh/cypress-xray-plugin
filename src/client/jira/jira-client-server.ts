import type { AxiosResponse } from "axios";
import type { SearchRequestServer } from "../../models/jira/requests/search";
import type { Issue } from "../../models/jira/responses/issue";
import type { SearchResultsServer } from "../../models/jira/responses/search-results";
import { LOG } from "../../util/logging";
import { loggedRequest } from "../util";
import { BaseJiraClient } from "./base-jira-client";
import type { HasSearchEndpoint } from "./jira-client";

/**
 * A Jira client class for communicating with Jira instances.
 */
export class JiraClientServer extends BaseJiraClient implements HasSearchEndpoint {
    @loggedRequest({ purpose: "search issues" })
    public async search(request: SearchRequestServer): Promise<Issue[]> {
        const header = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Searching issues...");
        let total = 0;
        let startAt = request.startAt ?? 0;
        const results: Record<string, Issue> = {};
        do {
            const paginatedRequest = {
                ...request,
                startAt: startAt,
            };
            const response: AxiosResponse<SearchResultsServer> = await this.httpClient.post(
                `${this.apiBaseUrl}/rest/api/latest/search`,
                paginatedRequest,
                {
                    headers: {
                        ...header,
                    },
                }
            );
            total = response.data.total ?? total;
            if (response.data.issues) {
                for (const issue of response.data.issues) {
                    if (issue.key) {
                        results[issue.key] = issue;
                    }
                }
                // Explicit check because it could also be 0.
                if (typeof response.data.startAt === "number") {
                    startAt = response.data.startAt + response.data.issues.length;
                }
            }
        } while (startAt && startAt < total);
        LOG.message("debug", `Found ${total.toString()} issues`);
        return Object.values(results);
    }
}
