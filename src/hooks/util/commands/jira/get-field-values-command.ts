import type { JiraClient } from "../../../../client/jira/jira-client";
import type { Issue } from "../../../../types/jira/responses/issue";
import type { StringMap } from "../../../../types/util";
import { dedent } from "../../../../util/dedent";
import { errorMessage } from "../../../../util/errors";
import type { Logger } from "../../../../util/logging";
import { Level } from "../../../../util/logging";
import type { Computable } from "../../../command";
import { Command } from "../../../command";

interface Parameters {
    jiraClient: JiraClient;
}

export abstract class GetFieldValuesCommand<FieldValue> extends Command<
    StringMap<FieldValue>,
    Parameters
> {
    protected readonly fieldId: Computable<string>;
    protected readonly issueKeys: Computable<string[]>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>
    ) {
        super(parameters, logger);
        this.fieldId = fieldId;
        this.issueKeys = issueKeys;
    }

    protected async extractJiraFieldValues(
        extractor: (issue: Issue, fieldId: string) => FieldValue | Promise<FieldValue>
    ): Promise<StringMap<FieldValue>> {
        const fieldId = await this.fieldId.compute();
        const issueKeys = await this.issueKeys.compute();
        const issues: Issue[] = await this.parameters.jiraClient.search({
            fields: [fieldId],
            jql: `issue in (${issueKeys.join(",")})`,
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
        const results: StringMap<FieldValue> = {};
        const issuesWithUnparseableField: string[] = [];
        for (const issue of issues) {
            if (!issue.key) {
                issuesWithUnparseableField.push(`Unknown: ${JSON.stringify(issue)}`);
            } else {
                try {
                    results[issue.key] = await extractor(issue, fieldId);
                } catch (error: unknown) {
                    issuesWithUnparseableField.push(`${issue.key}: ${errorMessage(error)}`);
                }
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
