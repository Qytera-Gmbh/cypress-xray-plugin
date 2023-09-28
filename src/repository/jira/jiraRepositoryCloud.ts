import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { StringMap } from "../../types/util";
import { JiraRepository } from "./jiraRepository";

export class JiraRepositoryCloud extends JiraRepository<JiraClientCloud, XrayClientCloud> {
    protected async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        const testTypes = await this.xrayClient.getTestTypes(
            this.jiraOptions.projectKey,
            ...issueKeys
        );
        return testTypes ? testTypes : {};
    }
}
