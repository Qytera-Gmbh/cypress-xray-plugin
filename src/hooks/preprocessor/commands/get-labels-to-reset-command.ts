import type { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import type { Logger } from "../../../util/logging";
import { Level } from "../../../util/logging";
import { unknownToString } from "../../../util/string";
import type { Computable } from "../../command";
import { Command } from "../../command";

export class GetLabelsToResetCommand extends Command<StringMap<string[]>, null> {
    private readonly oldValues: Computable<StringMap<string[]>>;
    private readonly newValues: Computable<StringMap<string[]>>;

    constructor(
        logger: Logger,
        oldValues: Computable<StringMap<string[]>>,
        newValues: Computable<StringMap<string[]>>
    ) {
        super(null, logger);
        this.oldValues = oldValues;
        this.newValues = newValues;
    }

    protected async computeResult(): Promise<StringMap<string[]>> {
        const oldValues = await this.oldValues.compute();
        const newValues = await this.newValues.compute();
        const toReset: StringMap<string[]> = {};
        for (const [issueKey, newLabels] of Object.entries(newValues)) {
            if (!(issueKey in oldValues)) {
                this.logger.message(
                    Level.WARNING,
                    dedent(`
                        ${issueKey}

                          The plugin tried to reset the issue's labels after importing the feature file, but could not because the previous labels could not be retrieved.

                          Make sure to manually restore them if needed.
                    `)
                );
                continue;
            }
            const oldLabels = oldValues[issueKey];
            if (
                oldLabels.length === newLabels.length &&
                newLabels.every((label) => oldLabels.includes(label))
            ) {
                this.logger.message(
                    Level.DEBUG,
                    dedent(`
                        ${issueKey}

                          Skipping resetting labels, the current labels are identical to the previous ones:

                            Previous labels: ${unknownToString(oldLabels)}
                            Current  labels: ${unknownToString(newLabels)}
                    `)
                );
                continue;
            }
            toReset[issueKey] = oldLabels;
        }
        return toReset;
    }
}
