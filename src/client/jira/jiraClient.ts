import { AxiosResponse } from "axios";
import dedent from "dedent";
import FormData from "form-data";
import fs from "fs";
import { BasicAuthCredentials, HTTPHeader, PATCredentials } from "../../authentication/credentials";
import { Requests } from "../../https/requests";
import {
    logDebug,
    logError,
    logInfo,
    logSuccess,
    logWarning,
    writeErrorFile,
} from "../../logging/logging";
import { SearchRequestCloud, SearchRequestServer } from "../../types/jira/requests/search";
import { AttachmentCloud, AttachmentServer } from "../../types/jira/responses/attachment";
import { FieldDetailCloud, FieldDetailServer } from "../../types/jira/responses/fieldDetail";
import { IssueCloud, IssueServer } from "../../types/jira/responses/issue";
import {
    IssueTypeDetailsCloud,
    IssueTypeDetailsServer,
} from "../../types/jira/responses/issueTypeDetails";
import { IssueUpdateCloud, IssueUpdateServer } from "../../types/jira/responses/issueUpdate";
import { JsonTypeCloud, JsonTypeServer } from "../../types/jira/responses/jsonType";
import { SearchResults } from "../../types/jira/responses/searchResults";
import { Client } from "../client";

/**
 * A Jira client class for communicating with Jira instances.
 */
export abstract class JiraClient<
    CredentialsType extends BasicAuthCredentials | PATCredentials,
    AttachmentType extends AttachmentServer | AttachmentCloud,
    FieldDetailType extends FieldDetailServer | FieldDetailCloud,
    JsonType extends JsonTypeServer | JsonTypeCloud,
    IssueType extends IssueServer | IssueCloud,
    IssueTypeDetailsResponse extends IssueTypeDetailsServer | IssueTypeDetailsCloud,
    SearchRequestType extends SearchRequestServer | SearchRequestCloud,
    IssueUpdateType extends IssueUpdateServer | IssueUpdateCloud
> extends Client<CredentialsType> {
    /**
     * Construct a new Jira client using the provided credentials.
     *
     * @param apiBaseURL the Jira base endpoint
     * @param credentials the credentials to use during authentication
     */
    constructor(apiBaseURL: string, credentials: CredentialsType) {
        super(apiBaseURL, credentials);
    }

    /**
     * Adds one or more attachments to an issue. Attachments are posted as multipart/form-data.
     *
     * @param issueIdOrKey the ID or key of the issue that attachments are added to
     * @param files the files to attach
     * @returns a list of issue attachment responses or `undefined` in case of errors
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.7.0/#api/2/issue/{issueIdOrKey}/attachments-addAttachment
     */
    public async addAttachment(
        issueIdOrKey: string,
        ...files: string[]
    ): Promise<AttachmentType[] | undefined> {
        if (files.length === 0) {
            logWarning(`No files provided to attach to issue ${issueIdOrKey}. Skipping attaching.`);
            return [];
        }
        const form = new FormData();
        let filesIncluded = 0;
        files.forEach((file: string) => {
            if (!fs.existsSync(file)) {
                logWarning("File does not exist:", file);
                return;
            }
            filesIncluded++;
            const fileContent = fs.createReadStream(file);
            form.append("file", fileContent);
        });

        if (filesIncluded === 0) {
            logWarning("All files do not exist. Skipping attaching.");
            return [];
        }

        try {
            return await this.credentials
                .getAuthenticationHeader()
                .then(async (header: HTTPHeader) => {
                    logInfo("Attaching files:", ...files);
                    const progressInterval = this.startResponseInterval(this.apiBaseURL);
                    try {
                        const response: AxiosResponse<AttachmentType[]> = await Requests.post(
                            this.getUrlAddAttachment(issueIdOrKey),
                            form,
                            {
                                headers: {
                                    ...header,
                                    ...form.getHeaders(),
                                    "X-Atlassian-Token": "no-check",
                                },
                            }
                        );
                        logSuccess(
                            dedent(`
                                Successfully attached files to issue: ${issueIdOrKey}
                                ${response.data
                                    .map((attachment: AttachmentType) => attachment.filename)
                                    .join("\n")}
                            `)
                        );
                        return response.data;
                    } finally {
                        clearInterval(progressInterval);
                    }
                });
        } catch (error: unknown) {
            logError(`Failed to attach files: ${error}`);
            writeErrorFile(error, "addAttachmentError");
        }
    }

    /**
     * Returns the endpoint to use for adding attchments to issues.
     *
     * @param issueIdOrKey the ID or key of the issue that attachments are added to
     * @returns the URL
     */
    public abstract getUrlAddAttachment(issueIdOrKey: string): string;

    /**
     * Returns all issue types.
     *
     * @returns the issue types or `undefined` in case of errors
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/issuetype-getIssueAllTypes
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-types/#api-rest-api-3-issuetype-get
     */
    public async getIssueTypes(): Promise<IssueTypeDetailsResponse[] | undefined> {
        try {
            const authenticationHeader = await this.credentials.getAuthenticationHeader();
            logInfo("Getting issue types...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const response: AxiosResponse<IssueTypeDetailsResponse[]> = await Requests.get(
                    this.getUrlGetIssueTypes(),
                    {
                        headers: {
                            ...authenticationHeader,
                        },
                    }
                );
                logSuccess(`Successfully retrieved data for ${response.data.length} issue types.`);
                logDebug(
                    dedent(`
                        Received data for issue types:
                        ${response.data
                            .map(
                                (issueType: IssueTypeDetailsResponse) =>
                                    `${issueType.name} (id: ${issueType.id})`
                            )
                            .join("\n")}
                    `)
                );
                return response.data;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to get issue types: ${error}`);
            writeErrorFile(error, "getIssueTypesError");
        }
    }

    /**
     * Returns the endpoint to use for retrieving issue types.
     *
     * @returns the URL
     */
    public abstract getUrlGetIssueTypes(): string;

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
    public async getFields(): Promise<FieldDetailType[] | undefined> {
        try {
            const authenticationHeader = await this.credentials.getAuthenticationHeader();
            logInfo("Getting fields...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const response: AxiosResponse<FieldDetailType[]> = await Requests.get(
                    this.getUrlGetFields(),
                    {
                        headers: {
                            ...authenticationHeader,
                        },
                    }
                );
                logSuccess(`Successfully retrieved data for ${response.data.length} fields`);
                logDebug(
                    dedent(`
                        Received data for fields:
                        ${response.data
                            .map((field: FieldDetailType) => `${field.name} (id: ${field.id})`)
                            .join("\n")}
                    `)
                );
                return response.data;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to get fields: ${error}`);
            writeErrorFile(error, "getFieldsError");
        }
    }

    /**
     * Returns the endpoint to use for retrieving fields.
     *
     * @returns the URL
     */
    public abstract getUrlGetFields(): string;

    /**
     * Searches for issues using JQL. Automatically performs pagination if necessary.
     *
     * @param request the search request
     * @returns the search results or `undefined` in case of errors
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/search-searchUsingSearchRequest
     */
    public async search(request: SearchRequestType): Promise<IssueType[] | undefined> {
        try {
            return await this.credentials
                .getAuthenticationHeader()
                .then(async (header: HTTPHeader) => {
                    logInfo(`Searching issues...`);
                    const progressInterval = this.startResponseInterval(this.apiBaseURL);
                    try {
                        let total = 0;
                        let startAt = request.startAt;
                        const results: IssueType[] = [];
                        do {
                            const paginatedRequest = {
                                ...request,
                            };
                            if (startAt !== undefined) {
                                paginatedRequest.startAt = startAt;
                            }
                            const response: AxiosResponse<SearchResults<IssueType, JsonType>> =
                                await Requests.post(this.getUrlPostSearch(), paginatedRequest, {
                                    headers: {
                                        ...header,
                                    },
                                });
                            results.push(...response.data.issues);
                            total = response.data.total;
                            startAt = response.data.startAt + response.data.issues.length;
                        } while (startAt && startAt < total);
                        logSuccess(`Found ${total} issues`);
                        return results;
                    } finally {
                        clearInterval(progressInterval);
                    }
                });
        } catch (error: unknown) {
            logError(`Failed to search issues: ${error}`);
            writeErrorFile(error, "searchError");
        }
    }
    /**
     *
     * Returns the endpoint to use for searching issues.
     *
     * @returns the endpoint
     */
    public abstract getUrlPostSearch(): string;

    /**
     * Edits an issue. A transition may be applied and issue properties updated as part of the edit.
     * The edits to the issue's fields are defined using `update` and `fields`.
     *
     * The parent field may be set by key or ID. For standard issue types, the parent may be removed
     * by setting `update.parent.set.none` to `true`.
     *
     * @param issueIdOrKey the ID or key of the issue
     * @param issueUpdateData the edit data
     * @returns the ID or key of the edited issue or `undefined` in case of errors
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-put
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.10.0/#api/2/issue-editIssue
     */
    public async editIssue(
        issueIdOrKey: string,
        issueUpdateData: IssueUpdateType
    ): Promise<string | undefined> {
        try {
            await this.credentials.getAuthenticationHeader().then(async (header: HTTPHeader) => {
                logInfo(`Editing issue...`);
                const progressInterval = this.startResponseInterval(this.apiBaseURL);
                try {
                    await Requests.put(this.getUrlEditIssue(issueIdOrKey), issueUpdateData, {
                        headers: {
                            ...header,
                        },
                    });
                    logSuccess(`Successfully edited issue: ${issueIdOrKey}`);
                } finally {
                    clearInterval(progressInterval);
                }
            });
            return issueIdOrKey;
        } catch (error: unknown) {
            logError(`Failed to edit issue: ${error}`);
            writeErrorFile(error, "editIssue");
        }
    }
    /**
     *
     * Returns the endpoint to use for editing issues.
     *
     * @param issueIdOrKey the ID or key of the issue
     * @returns the endpoint
     */
    public abstract getUrlEditIssue(issueIdOrKey: string): string;
}
