import { AxiosResponse } from "axios";
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
import { SearchResultsCloud, SearchResultsServer } from "../../types/jira/responses/searchResults";
import { Client } from "../client";

/**
 * A Jira client class for communicating with Jira instances.
 */
export abstract class JiraClient<
    CredentialsType extends BasicAuthCredentials | PATCredentials,
    AttachmentType extends AttachmentServer | AttachmentCloud,
    FieldDetailType extends FieldDetailServer | FieldDetailCloud,
    SearchRequestType extends SearchRequestServer | SearchRequestCloud,
    SearchResultsType extends SearchResultsServer | SearchResultsCloud
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
                            `Successfully attached files to issue ${issueIdOrKey}:`,
                            response.data
                                .map((attachment: AttachmentType) => attachment.filename)
                                .join(", ")
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
                logSuccess(`Successfully retrieved data for ${response.data.length} fields.`);
                logDebug(
                    "Received data for fields:",
                    ...response.data.map(
                        (field: FieldDetailType) => `${field.name} (id: ${field.id})`
                    )
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
     * @returns the search results (may contain multiple elements as a result of pagination) or
     * `undefined` in case of errors
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.9.1/#api/2/search-searchUsingSearchRequest
     */
    public async search(request: SearchRequestType): Promise<SearchResultsType[] | undefined> {
        try {
            return await this.credentials
                .getAuthenticationHeader()
                .then(async (header: HTTPHeader) => {
                    logInfo(`Searching issues...`);
                    const progressInterval = this.startResponseInterval(this.apiBaseURL);
                    try {
                        let total = 0;
                        let startAt = request.startAt;
                        const results: SearchResultsType[] = [];
                        do {
                            const paginatedRequest = {
                                ...request,
                            };
                            if (startAt !== undefined) {
                                paginatedRequest.startAt = startAt;
                            }
                            const response: AxiosResponse<SearchResultsType> = await Requests.post(
                                this.getUrlPostSearch(),
                                paginatedRequest,
                                {
                                    headers: {
                                        ...header,
                                    },
                                }
                            );
                            results.push(response.data);
                            if (response.data.total) {
                                total = response.data.total;
                            }
                            if (response.data.startAt !== undefined && response.data.issues) {
                                startAt = response.data.startAt + response.data.issues.length;
                            }
                        } while (startAt && startAt < total);
                        if (total === 1) {
                            logSuccess("Found 1 issue.");
                        } else {
                            logSuccess(`Found ${total} issues.`);
                        }
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
}
