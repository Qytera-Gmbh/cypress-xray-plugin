import type { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import type { Logger } from "../../../util/logging";
import { unknownToString } from "../../../util/string";
import type { Computable } from "../../command";
import { Command } from "../../command";

export class GetSummariesToResetCommand extends Command<StringMap<string>, null> {
    private readonly oldValues: Computable<StringMap<string>>;
    private readonly newValues: Computable<StringMap<string>>;

    constructor(
        logger: Logger,
        oldValues: Computable<StringMap<string>>,
        newValues: Computable<StringMap<string>>
    ) {
        super(null, logger);
        this.oldValues = oldValues;
        this.newValues = newValues;
    }

    protected async computeResult(): Promise<StringMap<string>> {
        const oldValues = await this.oldValues.compute();
        const newValues = await this.newValues.compute();
        const toReset: StringMap<string> = {};
        for (const [issueKey, newSummary] of Object.entries(newValues)) {
            if (!(issueKey in oldValues)) {
                this.logger.message(
                    "warning",
                    dedent(`
                        ${issueKey}

                          The plugin tried to reset the issue's summary after importing the feature file, but could not because the previous summary could not be retrieved.

                          Make sure to manually restore it if needed.
                    `)
                );
                continue;
            }
            const oldSummary = oldValues[issueKey];
            if (oldSummary === newSummary) {
                this.logger.message(
                    "debug",
                    dedent(`
                        ${issueKey}

                          Skipping resetting summary, the current summary is identical to the previous one:

                        Previous summary: ${unknownToString(oldSummary)}
                        Current  summary: ${unknownToString(newSummary)}
                    `)
                );
                continue;
            }
            toReset[issueKey] = oldSummary;
        }
        return toReset;
    }
}
