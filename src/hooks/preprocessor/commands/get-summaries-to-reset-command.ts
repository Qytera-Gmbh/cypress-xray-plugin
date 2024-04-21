import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { LOG, Level } from "../../../util/logging";
import { unknownToString } from "../../../util/string";
import { Command, CommandDescription, Computable } from "../../command";

export class GetSummariesToResetCommand extends Command<StringMap<string>, void> {
    private readonly oldValues: Computable<StringMap<string>>;
    private readonly newValues: Computable<StringMap<string>>;

    constructor(
        oldValues: Computable<StringMap<string>>,
        newValues: Computable<StringMap<string>>
    ) {
        super();
        this.oldValues = oldValues;
        this.newValues = newValues;
    }

    public getDescription(): CommandDescription {
        return {
            description:
                "Compares backed up Jira issue summaries with current summaries and returns the issues whose summaries need to be reverted to the backed up version.",
            runtimeInputs: [
                "a mapping of Jira issues to their backed up summaries",
                "a mapping of Jira issues to their current summaries",
            ],
        };
    }

    protected async computeResult(): Promise<StringMap<string>> {
        const oldValues = await this.oldValues.compute();
        const newValues = await this.newValues.compute();
        const toReset: StringMap<string> = {};
        for (const [issueKey, newSummary] of Object.entries(newValues)) {
            if (!(issueKey in oldValues)) {
                LOG.message(
                    Level.WARNING,
                    dedent(`
                        Skipping resetting summary of issue: ${issueKey}
                        The previous summary could not be fetched, make sure to manually restore it if needed
                    `)
                );
                continue;
            }
            const oldSummary = oldValues[issueKey];
            if (oldSummary === newSummary) {
                LOG.message(
                    Level.DEBUG,
                    dedent(`
                        Skipping resetting summary of issue: ${issueKey}
                        The current summary is identical to the previous one:

                        Previous summary: ${unknownToString(oldSummary)}
                        Current summary:  ${unknownToString(newSummary)}
                    `)
                );
                continue;
            }
            toReset[issueKey] = oldSummary;
        }
        return toReset;
    }
}
