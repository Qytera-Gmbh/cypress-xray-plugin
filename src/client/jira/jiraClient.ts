import { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import { BasicAuthCredentials, HTTPHeader, PATCredentials } from "../../authentication/credentials";
import { Requests } from "../../https/requests";
import { logDebug, logError, logInfo, logSuccess, logWarning } from "../../logging/logging";
import { AttachmentCloud, AttachmentServer } from "../../types/jira/responses/attachment";
import { FieldDetailCloud, FieldDetailServer } from "../../types/jira/responses/fieldDetail";
import {
    IssueTypeDetailsCloud,
    IssueTypeDetailsServer,
} from "../../types/jira/responses/issueTypeDetails";
import { OneOf } from "../../types/util";
import { Client } from "../client";

/**
 * A Jira client class for communicating with Jira instances.
 */
export abstract class JiraClient<
    AttachmentType extends OneOf<[AttachmentServer, AttachmentCloud]>,
    IssueTypeDetailsResponse extends OneOf<[IssueTypeDetailsServer, IssueTypeDetailsCloud]>
> extends Client<BasicAuthCredentials | PATCredentials> {
    /**
     * Construct a new Jira client using the provided credentials.
     *
     * @param apiBaseURL the Jira base endpoint
     * @param credentials the credentials to use during authentication
     */
    constructor(apiBaseURL: string, credentials: BasicAuthCredentials | PATCredentials) {
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
            logError(`Failed to attach files: "${error}"`);
            this.writeErrorFile(error, "addAttachment");
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
            return await this.credentials
                .getAuthenticationHeader()
                .then(async (header: HTTPHeader) => {
                    logInfo("Getting issue types...");
                    const progressInterval = this.startResponseInterval(this.apiBaseURL);
                    try {
                        const response: AxiosResponse<IssueTypeDetailsResponse[]> =
                            await Requests.get(this.getUrlGetIssueTypes(), {
                                headers: {
                                    ...header,
                                },
                            });
                        logSuccess(
                            `Successfully retrieved data for ${response.data.length} issue types.`
                        );
                        logDebug(
                            "Received data for issue types:",
                            ...response.data.map(
                                (issueType: IssueTypeDetailsResponse) =>
                                    `${issueType.name} (id: ${issueType.id})`
                            )
                        );
                        return response.data;
                    } finally {
                        clearInterval(progressInterval);
                    }
                });
        } catch (error: unknown) {
            logError(`Failed to get issue types: "${error}"`);
            this.writeErrorFile(error, "getIssueTypes");
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
    public async getFields<F extends OneOf<[FieldDetailServer, FieldDetailCloud]>>(): Promise<
        F[] | undefined
    > {
        try {
            return await this.credentials
                .getAuthenticationHeader()
                .then(async (header: HTTPHeader) => {
                    logInfo("Getting fields...");
                    const progressInterval = this.startResponseInterval(this.apiBaseURL);
                    try {
                        const response: AxiosResponse<F[]> = await Requests.get(
                            this.getUrlGetFields(),
                            {
                                headers: {
                                    ...header,
                                },
                            }
                        );
                        logSuccess(
                            `Successfully retrieved data for ${response.data.length} fields.`
                        );
                        logDebug(
                            "Received data for fields:",
                            ...response.data.map((field: F) => `${field.name} (id: ${field.id})`)
                        );
                        return response.data;
                    } finally {
                        clearInterval(progressInterval);
                    }
                });
        } catch (error: unknown) {
            logError(`Failed to get fields: "${error}"`);
            this.writeErrorFile(error, "getFields");
        }
    }

    /**
     * Returns the endpoint to use for retrieving fields.
     *
     * @returns the URL
     */
    public abstract getUrlGetFields(): string;
}
