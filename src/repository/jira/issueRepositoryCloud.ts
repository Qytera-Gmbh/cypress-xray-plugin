import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { FieldResponse, IssueRepository } from "./issueRepository";

export class IssueRepositoryCloud extends IssueRepository<XrayClientCloud, JiraClientCloud> {
    protected async fetchTestTypes(...issueKeys: string[]): Promise<FieldResponse<string>> {
        return this.xrayClient.getTestTypes(this.options.jira.projectKey, ...issueKeys);
    }
}
