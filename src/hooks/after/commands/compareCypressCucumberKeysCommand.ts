import { Command, Computable } from "../../../commands/command";
import { LOG, Level } from "../../../logging/logging";
import { dedent } from "../../../util/dedent";

export class CompareCypressCucumberKeysCommand extends Command<string> {
    private readonly resolvedCypressIssueKey: Computable<string>;
    private readonly resolvedCucumberIssueKey: Computable<string>;

    constructor(
        resolvedCypressIssueKey: Computable<string>,
        resolvedCucumberIssueKey: Computable<string>
    ) {
        super();
        this.resolvedCypressIssueKey = resolvedCypressIssueKey;
        this.resolvedCucumberIssueKey = resolvedCucumberIssueKey;
    }

    protected async computeResult(): Promise<string> {
        const resolvedCypressIssueKey = await this.resolvedCypressIssueKey.compute();
        const resolvedCucumberIssueKey = await this.resolvedCucumberIssueKey.compute();
        if (resolvedCypressIssueKey !== resolvedCucumberIssueKey) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Cucumber execution results were imported to test execution issue ${resolvedCucumberIssueKey}, which is different than the one of the Cypress execution results: ${resolvedCypressIssueKey}

                    This might be a bug, please report it at: https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues
                `)
            );
        }
        return resolvedCypressIssueKey;
    }
}
