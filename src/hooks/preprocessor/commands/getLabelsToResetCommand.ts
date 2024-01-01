import { LOG, Level } from "../../../logging/logging";
import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { unknownToString } from "../../../util/string";
import { Command, Computable } from "../../command";

export class GetLabelsToResetCommand extends Command<StringMap<string[]>> {
    private readonly oldValues: Computable<StringMap<string[]>>;
    private readonly newValues: Computable<StringMap<string[]>>;

    constructor(
        oldValues: Computable<StringMap<string[]>>,
        newValues: Computable<StringMap<string[]>>
    ) {
        super();
        this.oldValues = oldValues;
        this.newValues = newValues;
    }

    protected async computeResult(): Promise<StringMap<string[]>> {
        const oldValues = await this.oldValues.compute();
        const newValues = await this.newValues.compute();
        const toReset: StringMap<string[]> = {};
        for (const [issueKey, newLabels] of Object.entries(newValues)) {
            if (!(issueKey in oldValues)) {
                LOG.message(
                    Level.WARNING,
                    dedent(`
                        Skipping resetting labels of issue: ${issueKey}
                        The previous labels could not be fetched, make sure to manually restore them if needed
                    `)
                );
                continue;
            }
            const oldLabels = oldValues[issueKey];
            if (
                oldLabels.length === newLabels.length &&
                newLabels.every((label) => oldLabels.includes(label))
            ) {
                LOG.message(
                    Level.DEBUG,
                    dedent(`
                        Skipping resetting labels of issue: ${issueKey}
                        The current labels are identical to the previous ones:

                        Previous labels: ${unknownToString(oldLabels)}
                        Current labels:  ${unknownToString(newLabels)}
                    `)
                );
                continue;
            }
            toReset[issueKey] = oldLabels;
        }
        return toReset;
    }
}
