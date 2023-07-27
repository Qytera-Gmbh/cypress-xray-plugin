import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { StringMap } from "../../types/util";
import { JiraRepository } from "./jiraRepository";

export class JiraRepositoryServer extends JiraRepository<JiraClientServer, XrayClientServer> {
    protected async fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        // Field property example:
        // summary: "Bug 12345"
        return await this.getJiraField("Summary", JiraRepository.STRING_EXTRACTOR, ...issueKeys);
    }

    protected async fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        // Field property example:
        // description: "This is a description"
        return await this.getJiraField(
            "Description",
            JiraRepository.STRING_EXTRACTOR,
            ...issueKeys
        );
    }

    protected async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        // Field property example:
        // customfield_12100: {
        //   value: "Cucumber",
        //   id: "12702",
        //   disabled: false
        // }
        return await this.getJiraField(
            "Test Type",
            JiraRepository.OBJECT_VALUE_EXTRACTOR,
            ...issueKeys
        );
    }
}
