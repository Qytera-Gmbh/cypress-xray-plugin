import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { JiraFieldIds, Options } from "../../types/plugin";
import { JiraIssueStore, Order } from "./jiraIssueStore";

export class JiraIssueStoreCloud extends JiraIssueStore {
    private static readonly JIRA_API_FIELDS: (keyof JiraFieldIds)[] = [
        "description",
        "labels",
        "summary",
    ];
    private static readonly XRAY_API_FIELDS: (keyof JiraFieldIds)[] = ["testPlans", "testType"];
    private readonly options: Options;
    private readonly jiraClient: JiraClientCloud;
    private readonly xrayClient: XrayClientCloud;

    constructor(options: Options, jiraClient: JiraClientCloud, xrayClient: XrayClientCloud) {
        super([JiraIssueStoreCloud.JIRA_API_FIELDS, JiraIssueStoreCloud.XRAY_API_FIELDS]);
        this.options = options;
        this.jiraClient = jiraClient;
        this.xrayClient = xrayClient;
    }

    protected async checkoutIssues(order: Order): Promise<void> {
        if (order.fields.some((field) => JiraIssueStoreCloud.XRAY_API_FIELDS.includes(field))) {
            // Use Xray API.
        }
        // Use Jira API.
        await this.jiraClient.search({
            jql: `project = ${this.options.jira.projectKey} AND issue in (${order.issueKeys.join(
                ","
            )})`,
            fields: order.fields.map((field) => this.options.jira.fields[field]),
        });
        throw new Error("Method not supported");
    }
}
