import { JiraClient } from "../../../client/jira/jiraClient";
import { SupportedField } from "../../../repository/jira/fields/jiraIssueFetcher";
import { Issue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { Command, Computable } from "../../../util/command/command";
import { dedent } from "../../../util/dedent";
import { errorMessage } from "../../../util/errors";

export abstract class GetFieldValuesCommand<R> extends Command<StringMap<R>> {
    protected readonly fieldId: Computable<string>;
    protected readonly issueKeys: Computable<string[]>;
    constructor(fieldId: Computable<string>, issueKeys: Computable<string[]>) {
        super();
        this.fieldId = fieldId;
        this.issueKeys = issueKeys;
    }

    protected async extractJiraFieldValues(
        jiraClient: JiraClient,
        extractor: (issue: Issue, fieldId: string) => R | Promise<R>
    ): Promise<StringMap<R>> {
        const fieldId = await this.fieldId.getResult();
        const issueKeys = await this.issueKeys.getResult();
        const issues: Issue[] = await jiraClient.search({
            jql: `issue in (${issueKeys.join(",")})`,
            fields: [fieldId],
        });
        const results: StringMap<R> = {};
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

    public abstract getField(): SupportedField;
}
