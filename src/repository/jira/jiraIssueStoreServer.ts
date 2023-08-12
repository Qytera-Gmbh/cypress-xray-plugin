import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { Options } from "../../types/plugin";
import { JiraIssueStore, Order } from "./jiraIssueStore";

export class JiraIssueStoreServer extends JiraIssueStore {
    private readonly options: Options;

    constructor(options: Options) {
        super([["description", "labels", "summary", "testPlan", "testType"]]);
        this.options = options;
    }

    protected async checkoutIssues(order: Order): Promise<void> {
        await new JiraClientServer(null, null).search({
            jql: `project = ${this.options.jira.projectKey} AND issue in (${order.issueKeys.join(
                ","
            )})`,
            fields: order.fields.map((field) => this.options.jira.fields[field]),
        });
        throw new Error("Method not supported");
    }
}
