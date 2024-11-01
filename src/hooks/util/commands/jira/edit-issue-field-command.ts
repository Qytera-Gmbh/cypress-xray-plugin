import type { JiraClient } from "../../../../client/jira/jira-client.js";
import type { StringMap } from "../../../../types/util.js";
import { dedent } from "../../../../util/dedent.js";
import type { Logger } from "../../../../util/logging.js";
import { Level } from "../../../../util/logging.js";
import { unknownToString } from "../../../../util/string.js";
import type { Computable } from "../../../command.js";
import { Command } from "../../../command.js";

interface Parameters {
    fieldId: string;
    jiraClient: JiraClient;
}

export class EditIssueFieldCommand<FieldValue> extends Command<string[], Parameters> {
    private readonly fieldId: Computable<string>;
    private readonly fieldValues: Computable<StringMap<FieldValue>>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        fieldId: Computable<string>,
        fieldValues: Computable<StringMap<FieldValue>>
    ) {
        super(parameters, logger);
        this.fieldId = fieldId;
        this.fieldValues = fieldValues;
    }

    protected async computeResult(): Promise<string[]> {
        const fieldValues = await this.fieldValues.compute();
        const fieldId = await this.fieldId.compute();
        const successfullyEditedIssues: string[] = [];
        for (const [issueKey, newValue] of Object.entries(fieldValues)) {
            const fields = { [fieldId]: newValue };
            try {
                successfullyEditedIssues.push(
                    await this.parameters.jiraClient.editIssue(issueKey, { fields: fields })
                );
                // Error are logged in editIssue.
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error: unknown) {
                this.logger.message(
                    Level.WARNING,
                    dedent(`
                        ${issueKey}

                          Failed to set ${unknownToString(
                              this.parameters.fieldId
                          )} field to value: ${unknownToString(newValue)}
                    `)
                );
            }
        }
        return successfullyEditedIssues;
    }
}
