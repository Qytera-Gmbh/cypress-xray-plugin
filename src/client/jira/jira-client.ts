import type { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import type { SearchRequest } from "../../types/jira/requests/search";
import type { Attachment } from "../../types/jira/responses/attachment";
import type { FieldDetail } from "../../types/jira/responses/field-detail";
import type { Issue } from "../../types/jira/responses/issue";
import type { IssueTypeDetails } from "../../types/jira/responses/issue-type-details";
import type { IssueUpdate } from "../../types/jira/responses/issue-update";
import type { SearchResults } from "../../types/jira/responses/search-results";
import type { User } from "../../types/jira/responses/user";
import type { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { LOG } from "../../util/logging";
import { Client } from "../client";
import { loggedRequest } from "../util";

/**
 * All methods a Jira client needs to implement.
 */
export interface JiraClient {
    /**
     * Adds one or more attachments to an issue. Attachments are posted as multipart/form-data.
     *
     * @param issueIdOrKey - issueIdOrKey the ID or key of the issue that attachments are added to
     * @param files - files the files to attach
     * @returns a list of issue attachment responses
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.7.0/#api/2/issue/\{issueIdOrKey\}/attachments-addAttachment
     */
    addAttachment(issueIdOrKey: string, ...files: string[]): Promise<Attachment[]>;
    /**
     * Edits an issue. A transition may be applied and issue properties updated as part of the edit.
     * The edits to the issue's fields are defined using `update` and `fields`.
     *
     * The parent field may be set by key or ID. For standard issue types, the parent may be removed
     * by setting `update.parent.set.none` to `true`.
     *
     * @param issueIdOrKey - the ID or key of the issue
     * @param issueUpdateData - the edit data
     * @returns the ID or key of the edited issue
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.10.0/#api/2/issue-editIssue
     */
    editIssue(issueIdOrKey: string, issueUpdateData: IssueUpdate): Promise<string>;
    /**
     * Returns system and custom issue fields according to the following rules:
     * - Fields that cannot be added to the issue navigator are always returned
     * - Fields that cannot be placed on an issue screen are always returned
     * - Fields that depend on global Jira settings are only returned if the setting is enabled
     *   That is, timetracking fields, subtasks, votes, and watches
     * - For all other fields, this operation only returns the fields that the user has permission
     *   to view (that is, the field is used in at least one project that the user has *Browse
     *   Projects* project permission for)
     *
     * @returns the fields
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/field-getFields
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-fields/#api-rest-api-3-field-get
     */
    getFields(): Promise<FieldDetail[]>;
    /**
     * Returns all issue types.
     *
     * @returns the issue types
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/issuetype-getIssueAllTypes
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-types/#api-rest-api-3-issuetype-get
     */
    getIssueTypes(): Promise<IssueTypeDetails[]>;
    /**
     * Returns details for the current user.
     *
     * @returns the user details
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-myself/#api-rest-api-3-myself-get
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.11.0/#api/2/myself
     */
    getMyself(): Promise<User>;
    /**
     * Searches for issues using JQL. Automatically performs pagination if necessary.
     *
     * @param request - the search request
     * @returns the search results
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/search-searchUsingSearchRequest
     */
    search(request: SearchRequest): Promise<Issue[]>;
    /**
     * Performs an issue transition and, if the transition has a screen, updates the fields from the
     * transition screen.
     *
     * To update the fields on the transition screen, specify the fields in the `fields` or `update`
     * parameters in the request body. Get details about the fields using
     * [Get transitions](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-transitions-get)
     * with the `transitions.fields` expand.
     *
     * @param issueIdOrKey - the ID or key of the issue
     * @param issueUpdateData - the issue update data
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-transitions-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/issue-doTransition
     */
    transitionIssue(issueIdOrKey: string, issueUpdateData: IssueUpdate): Promise<void>;
}

/**
 * A Jira client class for communicating with Jira instances.
 */
export class BaseJiraClient extends Client implements JiraClient {
    @loggedRequest({ purpose: "attach files" })
    public async addAttachment(issueIdOrKey: string, ...files: string[]): Promise<Attachment[]> {
        if (files.length === 0) {
            LOG.message(
                "warning",
                `No files provided to attach to issue ${issueIdOrKey}. Skipping attaching.`
            );
            return [];
        }
        const form = new FormData();
        let filesIncluded = 0;
        files.forEach((file: string) => {
            if (!fs.existsSync(file)) {
                LOG.message("warning", "File does not exist:", file);
                return;
            }
            filesIncluded++;
            const fileContent = fs.createReadStream(file);
            form.append("file", fileContent);
        });

        if (filesIncluded === 0) {
            LOG.message("warning", "All files do not exist. Skipping attaching.");
            return [];
        }

        const header = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Attaching files:", ...files);
        const response: AxiosResponse<Attachment[]> = await this.httpClient.post(
            `${this.apiBaseUrl}/rest/api/latest/issue/${issueIdOrKey}/attachments`,
            form,
            {
                headers: {
                    ...header,
                    ...form.getHeaders(),
                    ["X-Atlassian-Token"]: "no-check",
                },
            }
        );
        LOG.message(
            "debug",
            dedent(`
                Successfully attached the following files to issue ${issueIdOrKey}:

                  ${response.data.map((attachment) => attachment.filename).join("\n")}
            `)
        );
        return response.data;
    }

    @loggedRequest({ purpose: "get issue types" })
    public async getIssueTypes(): Promise<IssueTypeDetails[]> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Getting issue types...");
        const response: AxiosResponse<IssueTypeDetails[]> = await this.httpClient.get(
            `${this.apiBaseUrl}/rest/api/latest/issuetype`,
            {
                headers: {
                    ...authorizationHeader,
                },
            }
        );
        LOG.message(
            "debug",
            `Successfully retrieved data for ${response.data.length.toString()} issue types.`
        );
        LOG.message(
            "debug",
            dedent(`
                Received data for issue types:

                  ${response.data
                      .map((issueType) => {
                          if (issueType.name) {
                              if (issueType.id) {
                                  return `${issueType.name} (id: ${issueType.id})`;
                              }
                              return `${issueType.name} (id: undefined)`;
                          } else if (issueType.id) {
                              return `undefined (id: ${issueType.id})`;
                          }
                          return "undefined (id: undefined)";
                      })
                      .join("\n")}
            `)
        );
        return response.data;
    }

    @loggedRequest({ purpose: "get fields" })
    public async getFields(): Promise<FieldDetail[]> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Getting fields...");
        const response: AxiosResponse<FieldDetail[]> = await this.httpClient.get(
            `${this.apiBaseUrl}/rest/api/latest/field`,
            {
                headers: {
                    ...authorizationHeader,
                },
            }
        );
        LOG.message(
            "debug",
            `Successfully retrieved data for ${response.data.length.toString()} fields.`
        );
        LOG.message(
            "debug",
            dedent(`
                Received data for fields:

                  ${response.data.map((field) => `${field.name} (id: ${field.id})`).join("\n")}
            `)
        );
        return response.data;
    }

    @loggedRequest({ purpose: "get user details" })
    public async getMyself(): Promise<User> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Getting user details...");
        const response: AxiosResponse<User> = await this.httpClient.get(
            `${this.apiBaseUrl}/rest/api/latest/myself`,
            {
                headers: {
                    ...authorizationHeader,
                },
            }
        );
        LOG.message("debug", "Successfully retrieved user details.");
        return response.data;
    }

    @loggedRequest({ purpose: "search issues" })
    public async search(request: SearchRequest): Promise<Issue[]> {
        const header = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Searching issues...");
        let total = 0;
        let startAt = request.startAt ?? 0;
        const results: StringMap<Issue> = {};
        do {
            const paginatedRequest = {
                ...request,
                startAt: startAt,
            };
            const response: AxiosResponse<SearchResults> = await this.httpClient.post(
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

    @loggedRequest({ purpose: "edit issue" })
    public async editIssue(issueIdOrKey: string, issueUpdateData: IssueUpdate): Promise<string> {
        const header = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Editing issue...");
        await this.httpClient.put(
            `${this.apiBaseUrl}/rest/api/latest/issue/${issueIdOrKey}`,
            issueUpdateData,
            {
                headers: {
                    ...header,
                },
            }
        );
        LOG.message("debug", `Successfully edited issue: ${issueIdOrKey}`);
        return issueIdOrKey;
    }

    @loggedRequest({ purpose: "transition issue" })
    public async transitionIssue(
        issueIdOrKey: string,
        issueUpdateData: IssueUpdate
    ): Promise<void> {
        const header = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Transitioning issue...");
        await this.httpClient.post(
            `${this.apiBaseUrl}/rest/api/latest/issue/${issueIdOrKey}/transitions`,
            issueUpdateData,
            {
                headers: {
                    ...header,
                },
            }
        );
        LOG.message("debug", `Successfully transitioned issue: ${issueIdOrKey}`);
    }
}
