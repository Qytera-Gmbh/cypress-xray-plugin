import { JiraClient } from "../../../client/jira/jiraClient";
import { LOG, Level } from "../../../logging/logging";
import { SupportedField } from "../../../repository/jira/fields/jiraIssueFetcher";
import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { unknownToString } from "../../../util/string";
import { Command, Computable } from "../../command";

export class ResetIssueFieldCommand<F extends SupportedField> extends Command<void> {
    private readonly jiraClient: JiraClient;
    private readonly field: F;
    private readonly fieldId: Computable<string>;
    private readonly issueKeys: Computable<string[]>;
    private readonly oldValues: Computable<StringMap<F>>;
    private readonly newValues: Computable<StringMap<F>>;
    constructor(
        jiraClient: JiraClient,
        field: F,
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>,
        oldValues: Computable<StringMap<F>>,
        newValues: Computable<StringMap<F>>
    ) {
        super();
        this.jiraClient = jiraClient;
        this.field = field;
        this.fieldId = fieldId;
        this.issueKeys = issueKeys;
        this.oldValues = oldValues;
        this.newValues = newValues;
    }

    public getField(): F {
        return this.field;
    }

    protected async computeResult(): Promise<void> {
        const issueKeys = await this.issueKeys.getResult();
        const oldValues = await this.oldValues.getResult();
        const newValues = await this.newValues.getResult();
        const fieldId = await this.fieldId.getResult();
        for (const issueKey of issueKeys) {
            const newValue = newValues[issueKey];
            if (!(issueKey in oldValues)) {
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Failed to reset ${unknownToString(
                            this.field
                        )} field of issue to previous value: ${issueKey}
                        The issue's previous value could not be fetched, make sure to restore it manually if needed

                        Current value: ${unknownToString(newValue)}
                    `)
                );
                continue;
            }
            const oldValue = oldValues[issueKey];
            if (oldValue !== newValue) {
                LOG.message(
                    Level.DEBUG,
                    dedent(`
                        Resetting ${unknownToString(this.field)} field of issue: ${issueKey}

                        Previous value: ${unknownToString(oldValue)}
                        Current value:  ${unknownToString(newValue)}
                    `)
                );
                const fields = { [fieldId]: oldValue };
                try {
                    await this.jiraClient.editIssue(issueKey, { fields: fields });
                } catch (error: unknown) {
                    LOG.message(
                        Level.ERROR,
                        dedent(`
                            Failed to reset ${unknownToString(
                                this.field
                            )} field of issue to its previous value: ${issueKey}

                            Previous value: ${unknownToString(oldValue)}
                            Current value:  ${unknownToString(newValue)}

                            Make sure to reset it manually if needed
                        `)
                    );
                }
            } else {
                LOG.message(
                    Level.DEBUG,
                    dedent(`
                        Skipping resetting ${unknownToString(
                            this.field
                        )} field of issue: ${issueKey}
                        The current value is identical to the previous one:

                        Previous value: ${unknownToString(oldValue)}
                        Current value:  ${unknownToString(newValue)}
                    `)
                );
            }
        }
    }
}
