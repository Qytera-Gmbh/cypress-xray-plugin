import { JiraClient } from "../../../../client/jira/jira-client";
import { StringMap } from "../../../../types/util";
import { dedent } from "../../../../util/dedent";
import { Level, Logger } from "../../../../util/logging";
import { unknownToString } from "../../../../util/string";
import { Command, Computable } from "../../../command";
import { FieldValueMap } from "./get-field-values-command";

interface Parameters<F extends keyof FieldValueMap> {
    field: F;
    jiraClient: JiraClient;
}

export class EditIssueFieldCommand<F extends keyof FieldValueMap> extends Command<
    string[],
    Parameters<F>
> {
    private readonly fieldId: Computable<string>;
    private readonly fieldValues: Computable<StringMap<FieldValueMap[F]>>;
    constructor(
        parameters: Parameters<F>,
        logger: Logger,
        fieldId: Computable<string>,
        fieldValues: Computable<StringMap<FieldValueMap[F]>>
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
                              this.parameters.field
                          )} field to value: ${unknownToString(newValue)}
                    `)
                );
            }
        }
        return successfullyEditedIssues;
    }
}
