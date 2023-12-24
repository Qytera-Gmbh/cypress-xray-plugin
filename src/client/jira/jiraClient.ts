import { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import { REST } from "../../https/requests";
import { LOG, Level } from "../../logging/logging";
import { SearchRequest } from "../../types/jira/requests/search";
import { Attachment } from "../../types/jira/responses/attachment";
import { FieldDetail } from "../../types/jira/responses/fieldDetail";
import { Issue } from "../../types/jira/responses/issue";
import { IssueTypeDetails } from "../../types/jira/responses/issueTypeDetails";
import { IssueUpdate } from "../../types/jira/responses/issueUpdate";
import { SearchResults } from "../../types/jira/responses/searchResults";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { Client } from "../client";

/**
 * All methods a Jira client needs to implement.
 */
export interface JiraClient {
    /**
     * Adds one or more attachments to an issue. Attachments are posted as multipart/form-data.
     *
     * @param issueIdOrKey - issueIdOrKey the ID or key of the issue that attachments are added to
     * @param files - files the files to attach
     * @returns a list of issue attachment responses or `undefined` in case of errors
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.7.0/#api/2/issue/\{issueIdOrKey\}/attachments-addAttachment
     */
    addAttachment(issueIdOrKey: string, ...files: string[]): Promise<Attachment[] | undefined>;
    /**
     * Returns all issue types.
     *
     * @returns the issue types or `undefined` in case of errors
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/issuetype-getIssueAllTypes
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-types/#api-rest-api-3-issuetype-get
     */
    getIssueTypes(): Promise<IssueTypeDetails[] | undefined>;
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
     * @returns the fields or `undefined` in case of errors
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/field-getFields
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-fields/#api-rest-api-3-field-get
     */
    getFields(): Promise<FieldDetail[] | undefined>;
    /**
     * Searches for issues using JQL. Automatically performs pagination if necessary.
     *
     * @param request - the search request
     * @returns the search results or `undefined` in case of errors
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/search-searchUsingSearchRequest
     */
    search(request: SearchRequest): Promise<Issue[] | undefined>;
    /**
     * Edits an issue. A transition may be applied and issue properties updated as part of the edit.
     * The edits to the issue's fields are defined using `update` and `fields`.
     *
     * The parent field may be set by key or ID. For standard issue types, the parent may be removed
     * by setting `update.parent.set.none` to `true`.
     *
     * @param issueIdOrKey - the ID or key of the issue
     * @param issueUpdateData - the edit data
     * @returns the ID or key of the edited issue or `undefined` in case of errors
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.10.0/#api/2/issue-editIssue
     */
    editIssue(issueIdOrKey: string, issueUpdateData: IssueUpdate): Promise<string | undefined>;
}

/**
 * A Jira client class for communicating with Jira instances.
 */
export abstract class AbstractJiraClient extends Client implements JiraClient {
    public async addAttachment(
        issueIdOrKey: string,
        ...files: string[]
    ): Promise<Attachment[] | undefined> {
        if (files.length === 0) {
            LOG.message(
                Level.WARNING,
                `No files provided to attach to issue ${issueIdOrKey}. Skipping attaching.`
            );
            return [];
        }
        const form = new FormData();
        let filesIncluded = 0;
        files.forEach((file: string) => {
            if (!fs.existsSync(file)) {
                LOG.message(Level.WARNING, "File does not exist:", file);
                return;
            }
            filesIncluded++;
            const fileContent = fs.createReadStream(file);
            form.append("file", fileContent);
        });

        if (filesIncluded === 0) {
            LOG.message(Level.WARNING, "All files do not exist. Skipping attaching.");
            return [];
        }

        try {
            const header = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Attaching files:", ...files);
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const response: AxiosResponse<Attachment[]> = await REST.post(
                    this.getUrlAddAttachment(issueIdOrKey),
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
                    Level.DEBUG,
                    dedent(`
                        Successfully attached files to issue: ${issueIdOrKey}
                          ${response.data.map((attachment) => attachment.filename).join("\n")}
                    `)
                );
                return response.data;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to attach files: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "addAttachmentError");
        }
    }

    public async getIssueTypes(): Promise<IssueTypeDetails[] | undefined> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Getting issue types...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const response: AxiosResponse<IssueTypeDetails[]> = await REST.get(
                    this.getUrlGetIssueTypes(),
                    {
                        headers: {
                            ...authorizationHeader,
                        },
                    }
                );
                LOG.message(
                    Level.DEBUG,
                    `Successfully retrieved data for ${response.data.length} issue types.`
                );
                LOG.message(
                    Level.DEBUG,
                    dedent(`
                        Received data for issue types:
                        ${response.data
                            .map((issueType) => `${issueType.name} (id: ${issueType.id})`)
                            .join("\n")}
                    `)
                );
                return response.data;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to get issue types: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "getIssueTypesError");
        }
    }

    public async getFields(): Promise<FieldDetail[] | undefined> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Getting fields...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const response: AxiosResponse<FieldDetail[]> = await REST.get(
                    this.getUrlGetFields(),
                    {
                        headers: {
                            ...authorizationHeader,
                        },
                    }
                );
                LOG.message(
                    Level.DEBUG,
                    `Successfully retrieved data for ${response.data.length} fields`
                );
                LOG.message(
                    Level.DEBUG,
                    dedent(`
                        Received data for fields:
                        ${response.data
                            .map((field) => `${field.name} (id: ${field.id})`)
                            .join("\n")}
                    `)
                );
                return response.data;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to get fields: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "getFieldsError");
        }
    }

    public async search(request: SearchRequest): Promise<Issue[] | undefined> {
        try {
            const header = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Searching issues...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                let total = 0;
                let startAt = request.startAt ?? 0;
                const results: Issue[] = [];
                do {
                    const paginatedRequest = {
                        ...request,
                        startAt: startAt,
                    };
                    const response: AxiosResponse<SearchResults> = await REST.post(
                        this.getUrlPostSearch(),
                        paginatedRequest,
                        {
                            headers: {
                                ...header,
                            },
                        }
                    );
                    total = response.data.total ?? total;
                    if (response.data.issues) {
                        results.push(...response.data.issues);
                        // Explicit check because it could also be 0.
                        if (typeof response.data.startAt === "number") {
                            startAt = response.data.startAt + response.data.issues.length;
                        }
                    }
                } while (startAt && startAt < total);
                LOG.message(Level.DEBUG, `Found ${total} issues`);
                return results;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to search issues: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "searchError");
        }
    }

    public async editIssue(
        issueIdOrKey: string,
        issueUpdateData: IssueUpdate
    ): Promise<string | undefined> {
        try {
            const header = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Editing issue...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                await REST.put(this.getUrlEditIssue(issueIdOrKey), issueUpdateData, {
                    headers: {
                        ...header,
                    },
                });
                LOG.message(Level.DEBUG, `Successfully edited issue: ${issueIdOrKey}`);
            } finally {
                clearInterval(progressInterval);
            }
            return issueIdOrKey;
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to edit issue: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "editIssue");
        }
    }

    /**
     * Returns the endpoint to use for adding attchments to issues.
     *
     * @param issueIdOrKey - the ID or key of the issue that attachments are added to
     * @returns the URL
     */
    public abstract getUrlAddAttachment(issueIdOrKey: string): string;

    /**
     * Returns the endpoint to use for retrieving issue types.
     *
     * @returns the URL
     */
    public abstract getUrlGetIssueTypes(): string;

    /**
     * Returns the endpoint to use for retrieving fields.
     *
     * @returns the URL
     */
    public abstract getUrlGetFields(): string;

    /**
     * Returns the endpoint to use for searching issues.
     *
     * @returns the endpoint
     */
    public abstract getUrlPostSearch(): string;

    /**
     * Returns the endpoint to use for editing issues.
     *
     * @param issueIdOrKey - the ID or key of the issue
     * @returns the endpoint
     */
    public abstract getUrlEditIssue(issueIdOrKey: string): string;
}
