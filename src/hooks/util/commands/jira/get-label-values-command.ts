import { JiraClient } from "../../../../client/jira/jira-client";
import { Issue } from "../../../../types/jira/responses/issue";
import { StringMap } from "../../../../types/util";
import { extractArrayOfStrings } from "../../../../util/extraction";
import { Logger } from "../../../../util/logging";
import { Computable } from "../../../command";
import { ConstantCommand } from "../constant-command";
import { GetFieldValuesCommand } from "./get-field-values-command";

export class GetLabelValuesCommand extends GetFieldValuesCommand<string[]> {
    constructor(
        parameters: { jiraClient: JiraClient },
        logger: Logger,
        issueKeys: Computable<string[]>
    ) {
        super(parameters, logger, new ConstantCommand(logger, "labels"), issueKeys);
    }

    protected async computeResult(): Promise<StringMap<string[]>> {
        // Field property example:
        // labels: ["regression", "quality"]
        return await this.extractJiraFieldValues((issue: Issue) =>
            extractArrayOfStrings(issue.fields, "labels")
        );
    }
}
