import { JiraClient } from "../../../../client/jira/jira-client";
import { StringMap } from "../../../../types/util";
import { dedent } from "../../../../util/dedent";
import { LOG, Level } from "../../../../util/logging";
import { unknownToString } from "../../../../util/string";
import { Command, Computable } from "../../../command";
import { JiraField } from "./extract-field-id-command";
import { FieldValueMap } from "./get-field-values-command";

export class EditIssueFieldCommand<F extends keyof FieldValueMap> extends Command<string[]> {
    private readonly jiraClient: JiraClient;
    private readonly field: JiraField;
    private readonly fieldId: Computable<string>;
    private readonly fieldValues: Computable<StringMap<FieldValueMap[F]>>;
    constructor(
        jiraClient: JiraClient,
        field: F,
        fieldId: Computable<string>,
        fieldValues: Computable<StringMap<FieldValueMap[F]>>
    ) {
        super();
        this.jiraClient = jiraClient;
        this.field = field;
        this.fieldId = fieldId;
        this.fieldValues = fieldValues;
    }

    public getField(): JiraField {
        return this.field;
    }

    protected async computeResult(): Promise<string[]> {
        const fieldValues = await this.fieldValues.compute();
        const fieldId = await this.fieldId.compute();
        const successfullyEditedIssues: string[] = [];
        for (const [issueKey, newValue] of Object.entries(fieldValues)) {
            const fields = { [fieldId]: newValue };
            try {
                successfullyEditedIssues.push(
                    await this.jiraClient.editIssue(issueKey, { fields: fields })
                );
            } catch (error: unknown) {
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Failed to set ${unknownToString(
                            this.field
                        )} field of issue ${issueKey} to value: ${unknownToString(newValue)}
                    `)
                );
            }
        }
        return successfullyEditedIssues;
    }
}