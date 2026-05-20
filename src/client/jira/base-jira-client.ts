import type { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import type { Attachment } from "../../models/jira/responses/attachment";
import type { FieldDetail } from "../../models/jira/responses/field-detail";
import type { IssueTypeDetails } from "../../models/jira/responses/issue-type-details";
import type { IssueUpdate } from "../../models/jira/responses/issue-update";
import type { User } from "../../models/jira/responses/user";
import { dedent } from "../../util/dedent";
import { LOG } from "../../util/logging";
import { Client } from "../client";
import { loggedRequest } from "../util";
import type {
    HasAddAttachmentEndpoint,
    HasEditIssueEndpoint,
    HasGetFieldsEndpoint,
    HasGetIssueTypesEndpoint,
    HasMyselfEndpoint,
    HasTransitionIssueEndpoint,
} from "./jira-client";

/**
 * A Jira client class for communicating with Jira instances.
 */
export class BaseJiraClient
    extends Client
    implements
        HasAddAttachmentEndpoint,
        HasEditIssueEndpoint,
        HasGetFieldsEndpoint,
        HasGetIssueTypesEndpoint,
        HasMyselfEndpoint,
        HasTransitionIssueEndpoint
{
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
