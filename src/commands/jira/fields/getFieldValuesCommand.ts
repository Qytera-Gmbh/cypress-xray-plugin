import { JiraClient } from "../../../client/jira/jiraClient";
import { SupportedField } from "../../../repository/jira/fields/jiraIssueFetcher";
import { Issue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { errorMessage } from "../../../util/errors";
import { Command, Computable } from "../../command";

export interface FieldValueMap {
    [SupportedField.SUMMARY]: string;
    [SupportedField.LABELS]: string[];
    [SupportedField.TEST_TYPE]: string;
}

export abstract class GetFieldValuesCommand<F extends keyof FieldValueMap> extends Command<
    StringMap<FieldValueMap[F]>
> {
    protected readonly jiraClient: JiraClient;
    protected readonly fieldId: Computable<string>;
    protected readonly issueKeys: Computable<string[]>;
    constructor(
        jiraClient: JiraClient,
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>
    ) {
        super();
        this.jiraClient = jiraClient;
        this.fieldId = fieldId;
        this.issueKeys = issueKeys;
    }

    protected async extractJiraFieldValues(
        extractor: (issue: Issue, fieldId: string) => FieldValueMap[F] | Promise<FieldValueMap[F]>
    ): Promise<StringMap<FieldValueMap[F]>> {
        const fieldId = await this.fieldId.getResult();
        const issueKeys = await this.issueKeys.getResult();
        const issues: Issue[] = await this.jiraClient.search({
            jql: `issue in (${issueKeys.join(",")})`,
            fields: [fieldId],
        });
        const results: StringMap<FieldValueMap[F]> = {};
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
        return results;
    }
}
