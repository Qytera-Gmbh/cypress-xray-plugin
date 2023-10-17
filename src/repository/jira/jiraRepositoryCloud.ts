import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { StringMap } from "../../types/util";
import { JiraRepository } from "./jiraRepository";

export class JiraRepositoryCloud extends JiraRepository<XrayClientCloud> {
    protected async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        return await this.xrayClient.getTestTypes(this.jiraOptions.projectKey, ...issueKeys);
    }
}
