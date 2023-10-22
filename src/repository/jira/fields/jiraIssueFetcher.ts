import { IJiraClient } from "../../../client/jira/jiraClient";
import { IXrayClientCloud } from "../../../client/xray/xrayClientCloud";
import { IIssue } from "../../../types/jira/responses/issue";
import { InternalJiraOptions, JiraFieldIds } from "../../../types/plugin";
import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { errorMessage } from "../../../util/errors";
import {
    extractArrayOfStrings,
    extractNestedString,
    extractString,
} from "../../../util/extraction";
import { IJiraFieldRepository } from "./jiraFieldRepository";

export enum SupportedFields {
    DESCRIPTION = "description",
    SUMMARY = "summary",
    LABELS = "labels",
    TEST_ENVIRONMENTS = "test environments",
    TEST_PLAN = "test plan",
    TEST_TYPE = "test type",
}

export interface IJiraIssueFetcher {
    fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>>;
    fetchLabels(...issueKeys: string[]): Promise<StringMap<string[]>>;
    fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>>;
    fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>>;
}

export class JiraIssueFetcher implements IJiraIssueFetcher {
    constructor(
        private readonly jiraClient: IJiraClient,
        private readonly jiraFieldRepository: IJiraFieldRepository,
        private readonly fieldIds?: JiraFieldIds
    ) {}

    public async fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        let summaryId = this.fieldIds?.summary;
        if (!summaryId) {
            summaryId = await this.jiraFieldRepository.getFieldId(SupportedFields.SUMMARY);
        }
        // Field property example:
        // summary: "Bug 12345"
        const fields = await this.fetchFieldData(
            summaryId,
            (issue, fieldId) => {
                return extractString(issue.fields, fieldId);
            },
            ...issueKeys
        );
        return fields;
    }

    public async fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        let descriptionId = this.fieldIds?.description;
        if (!descriptionId) {
            descriptionId = await this.jiraFieldRepository.getFieldId(SupportedFields.DESCRIPTION);
        }
        // Field property example:
        // description: "This is a description"
        const fields = await this.fetchFieldData(
            descriptionId,
            (issue, fieldId) => {
                return extractString(issue.fields, fieldId);
            },
            ...issueKeys
        );
        return fields;
    }

    public async fetchLabels(...issueKeys: string[]): Promise<StringMap<string[]>> {
        let labelsId = this.fieldIds?.labels;
        if (!labelsId) {
            labelsId = await this.jiraFieldRepository.getFieldId(SupportedFields.LABELS);
        }
        // Field property example:
        // labels: ["regression", "quality"]
        const fields = await this.fetchFieldData(
            labelsId,
            (issue, fieldId) => {
                return extractArrayOfStrings(issue.fields, fieldId);
            },
            ...issueKeys
        );
        return fields;
    }

    public async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        let testTypeId = this.fieldIds?.testType;
        if (!testTypeId) {
            testTypeId = await this.jiraFieldRepository.getFieldId(SupportedFields.TEST_TYPE);
        }
        // Field property example:
        // customfield_12100: {
        //   value: "Cucumber",
        //   id: "12702",
        //   disabled: false
        // }
        const fields = await this.fetchFieldData(
            testTypeId,
            (issue, fieldId) => {
                return extractNestedString(issue.fields, [fieldId, "value"]);
            },
            ...issueKeys
        );
        return fields;
    }

    private async fetchFieldData<T>(
        fieldId: string,
        extractor: (issue: IIssue, fieldId: string) => T | Promise<T>,
        ...issueKeys: string[]
    ): Promise<StringMap<T>> {
        const results: StringMap<T> = {};
        const issues: IIssue[] | undefined = await this.jiraClient.search({
            jql: `issue in (${issueKeys.join(",")})`,
            fields: [fieldId],
        });
        if (issues) {
            const issuesWithUnparseableField: string[] = [];
            for (const issue of issues) {
                try {
                    if (issue.key) {
                        results[issue.key] = await extractor(issue, fieldId);
                    } else {
                        issuesWithUnparseableField.push(`Unknown: ${JSON.stringify(issue)}`);
                    }
                } catch (error: unknown) {
                    issuesWithUnparseableField.push(
                        `${issue.key ?? "Unknown issue"}: ${errorMessage(error)}`
                    );
                }
            }
            if (issuesWithUnparseableField.length > 0) {
                issuesWithUnparseableField.sort();
                throw new Error(
                    dedent(`
                        Failed to parse Jira field with ID: ${fieldId}
                        Make sure the correct field is present on the following issues:

                          ${issuesWithUnparseableField.join("\n")}
                    `)
                );
            }
        }
        return results;
    }
}

export class JiraIssueFetcherCloud extends JiraIssueFetcher {
    constructor(
        jiraClient: IJiraClient,
        jiraFieldRepository: IJiraFieldRepository,
        private readonly xrayClient: IXrayClientCloud,
        private readonly jiraOptions: InternalJiraOptions
    ) {
        super(jiraClient, jiraFieldRepository, jiraOptions.fields);
    }

    public async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        return await this.xrayClient.getTestTypes(this.jiraOptions.projectKey, ...issueKeys);
    }
}
