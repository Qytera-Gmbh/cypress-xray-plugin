import { JiraClient } from "../../../../client/jira/jira-client";
import { Issue } from "../../../../types/jira/responses/issue";
import { StringMap } from "../../../../types/util";
import { extractString } from "../../../../util/extraction";
import { Logger } from "../../../../util/logging";
import { Computable } from "../../../command";
import { ConstantCommand } from "../constant-command";
import { JiraField } from "./extract-field-id-command";
import { GetFieldValuesCommand } from "./get-field-values-command";

export class GetSummaryValuesCommand extends GetFieldValuesCommand<JiraField.SUMMARY> {
    constructor(
        parameters: { jiraClient: JiraClient },
        logger: Logger,
        issueKeys: Computable<string[]>
    ) {
        super(parameters, logger, new ConstantCommand(logger, "summary"), issueKeys);
    }

    protected async computeResult(): Promise<StringMap<string>> {
        // Field property example:
        // summary: "Bug 12345"
        return await super.extractJiraFieldValues((issue: Issue) =>
            extractString(issue.fields, "summary")
        );
    }
}
