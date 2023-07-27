import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { StringMap } from "../../types/util";
import { JiraRepository } from "./jiraRepository";

export class JiraRepositoryCloud extends JiraRepository<JiraClientCloud, XrayClientCloud> {
    protected async fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        // Field property example:
        // summary: "Bug 12345"
        return await this.getJiraField("summary", JiraRepository.STRING_EXTRACTOR, ...issueKeys);
    }

    protected async fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        // Field property example:
        // description: "This is a description"
        return await this.getJiraField(
            "description",
            JiraRepository.STRING_EXTRACTOR,
            ...issueKeys
        );
    }

    protected async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        const testTypes = await this.xrayClient.getTestTypes(
            this.options.jira.projectKey,
            ...issueKeys
        );
        return testTypes ? testTypes : {};
    }
}
