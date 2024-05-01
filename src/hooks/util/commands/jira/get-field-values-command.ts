import { JiraClient } from "../../../../client/jira/jira-client";
import { Issue } from "../../../../types/jira/responses/issue";
import { StringMap } from "../../../../types/util";
import { dedent } from "../../../../util/dedent";
import { errorMessage } from "../../../../util/errors";
import { Level } from "../../../../util/logging";
import { Command, Computable } from "../../../command";
import { JiraField } from "./extract-field-id-command";

export interface FieldValueMap {
    [JiraField.SUMMARY]: string;
    [JiraField.LABELS]: string[];
    [JiraField.TEST_TYPE]: string;
}

interface Parameters {
    jiraClient: JiraClient;
}

export abstract class GetFieldValuesCommand<F extends keyof FieldValueMap> extends Command<
    StringMap<FieldValueMap[F]>,
    Parameters
> {
    protected readonly fieldId: Computable<string>;
    protected readonly issueKeys: Computable<string[]>;
    constructor(
        parameters: Parameters,
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>
    ) {
        super(parameters);
        this.fieldId = fieldId;
        this.issueKeys = issueKeys;
    }

    protected async extractJiraFieldValues(
        extractor: (issue: Issue, fieldId: string) => FieldValueMap[F] | Promise<FieldValueMap[F]>
    ): Promise<StringMap<FieldValueMap[F]>> {
        const fieldId = await this.fieldId.compute();
        const issueKeys = await this.issueKeys.compute();
        const issues: Issue[] = await this.parameters.jiraClient.search({
            jql: `issue in (${issueKeys.join(",")})`,
            fields: [fieldId],
        });
        const unknownIssues = issueKeys.filter((key) => issues.every((issue) => issue.key !== key));
        if (unknownIssues.length > 0) {
            unknownIssues.sort();
            this.logger.message(
                Level.WARNING,
                dedent(`
                    Failed to find Jira issues:

                      ${unknownIssues.join("\n")}
                `)
            );
        }
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
                    `${issue.key ?? "undefined"}: ${errorMessage(error)}`
                );
            }
        }
        if (issuesWithUnparseableField.length > 0) {
            issuesWithUnparseableField.sort();
            this.logger.message(
                Level.WARNING,
                dedent(`
                    Failed to parse Jira field with ID ${fieldId} in issues:

                      ${issuesWithUnparseableField.join("\n")}
                `)
            );
        }
        return results;
    }
}
