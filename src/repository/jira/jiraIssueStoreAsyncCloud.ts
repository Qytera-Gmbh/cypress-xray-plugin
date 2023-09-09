import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { JiraFieldIds, Options } from "../../types/plugin";
import { IssueResponse, JiraIssueStore, Order } from "./jiraIssueStoreAsync";

type FieldName = keyof JiraFieldIds;

export class JiraIssueStoreCloud extends JiraIssueStore {
    protected readonly jiraClient: JiraClientCloud;
    protected readonly xrayClient: XrayClientCloud;
    protected readonly options: Options;

    private static readonly FIELDS_JIRA: FieldName[] = ["description", "labels", "summary"];
    private static readonly FIELDS_XRAY: FieldName[] = ["testPlans", "testType"];

    constructor() {
        super([JiraIssueStoreCloud.FIELDS_JIRA, JiraIssueStoreCloud.FIELDS_XRAY]);
    }

    protected async checkoutIssues(order: Order): Promise<IssueResponse[]> {
        const issueResponses: IssueResponse[] = [];

        if (order.fields.some((field) => JiraIssueStoreCloud.FIELDS_XRAY.includes(field))) {
            await this.xrayClient.getTestTypes(this.options.jira.projectKey, ...order.issueKeys);
            // ...
        } else {
            // ...
        }
        return issueResponses;
    }
}
