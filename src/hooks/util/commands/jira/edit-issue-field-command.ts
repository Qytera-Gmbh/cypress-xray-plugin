import { JiraClient } from "../../../../client/jira/jira-client";
import { StringMap } from "../../../../types/util";
import { dedent } from "../../../../util/dedent";
import { Level, Logger } from "../../../../util/logging";
import { unknownToString } from "../../../../util/string";
import { Command, Computable } from "../../../command";

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
