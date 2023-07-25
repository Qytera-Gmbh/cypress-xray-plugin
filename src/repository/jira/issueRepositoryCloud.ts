import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { FieldResponse, IssueRepository } from "./issueRepository";

export class IssueRepositoryCloud extends IssueRepository<XrayClientCloud, JiraClientCloud> {
    protected async fetchSummaries(...issueKeys: string[]): Promise<FieldResponse<string>> {
        // Field property example:
        // summary: "Bug 12345"
        return await this.getJiraField("summary", this.stringExtractor.bind(this), ...issueKeys);
    }

    protected async fetchDescriptions(...issueKeys: string[]): Promise<FieldResponse<string>> {
        // Field property example:
        // description: "This is a description"
        return await this.getJiraField("description", this.stringExtractor, ...issueKeys);
    }

    protected async fetchTestTypes(...issueKeys: string[]): Promise<FieldResponse<string>> {
        const testTypes = await this.xrayClient.getTestTypes(
            this.options.jira.projectKey,
            ...issueKeys
        );
        return testTypes ? testTypes : {};
    }
}
