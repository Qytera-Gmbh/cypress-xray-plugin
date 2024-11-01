import type { JiraClient } from "../../../../client/jira/jira-client.js";
import type { Issue } from "../../../../types/jira/responses/issue.js";
import type { StringMap } from "../../../../types/util.js";
import { extractArrayOfStrings } from "../../../../util/extraction.js";
import type { Logger } from "../../../../util/logging.js";
import type { Computable } from "../../../command.js";
import { ConstantCommand } from "../constant-command.js";
import { GetFieldValuesCommand } from "./get-field-values-command.js";

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
