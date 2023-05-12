import { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import {
    BasicAuthCredentials,
    HTTPHeader,
    PATCredentials,
} from "../../authentication/credentials";
import { Requests } from "../../https/requests";
import {
    logError,
    logInfo,
    logSuccess,
    logWarning,
} from "../../logging/logging";
import { Attachment } from "../../types/jira/attachments";
import { Client } from "../client";

/**
 * A Jira client class for communicating with Jira instances.
 */
export class JiraClient extends Client<BasicAuthCredentials | PATCredentials> {
    /**
     * The Jira URL.
     */
    private readonly apiBaseURL: string;
    /**
     * Construct a new Jira client using the provided credentials.
     *
     * @param apiBaseURL the Jira base endpoint
     * @param credentials the credentials to use during authentication
     */
    constructor(
        apiBaseURL: string,
        credentials: BasicAuthCredentials | PATCredentials
    ) {
        super(credentials);
        this.apiBaseURL = apiBaseURL;
    }

    /**
     * Adds one or more attachments to an issue. Attachments are posted as multipart/form-data.
     *
     * @param issueIdOrKey the ID or key of the issue that attachments are added to
     * @param files the files to attach
     * @returns a list of issue attachment responses
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/#api-rest-api-3-issue-issueidorkey-attachments-post
     * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.7.0/#api/2/issue/{issueIdOrKey}/attachments-addAttachment
     */
    public async addAttachments(
        issueIdOrKey: string,
        ...files: string[]
    ): Promise<Attachment[]> {
        logInfo(`Scanning files to attach to ${issueIdOrKey}...`);
        const existingFiles = files.filter((file: string) => {
            if (!fs.existsSync(file)) {
                logError(
                    `Failed to add attachment ${file}: file does not exist.`
                );
                return false;
            }
            return true;
        });
        if (existingFiles.length === 0) {
            logWarning(
                `No files provided to attach to issue ${issueIdOrKey}. Skipping attaching.`
            );
            return [];
        }
        const form = new FormData();
        existingFiles.forEach((file: string) => {
            const fileContent = fs.createReadStream(file);
            form.append("file", fileContent);
        });

        try {
            return await this.credentials
                .getAuthenticationHeader()
                .then(async (header: HTTPHeader) => {
                    logInfo(`Attaching files...`);
                    const progressInterval = this.startResponseInterval(
                        this.apiBaseURL
                    );
                    try {
                        const response: AxiosResponse<Attachment[]> =
                            await Requests.post(
                                `${this.apiBaseURL}/rest/api/2/issue/${issueIdOrKey}/attachments`,
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
                                .map(
                                    (attachment: Attachment) =>
                                        attachment.filename
                                )
                                .join(", ")
                        );
                        return response.data;
                    } finally {
                        clearInterval(progressInterval());
                    }
                });
        } catch (error: unknown) {
            logError(`Failed to attach files: "${error}"`);
            this.writeErrorFile(error, "addAttachmentError");
        }
    }
}
