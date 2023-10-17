import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { StringMap } from "../../types/util";
import { JiraRepository } from "./jiraRepository";

export class JiraRepositoryServer extends JiraRepository<XrayClientServer> {
    protected async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        let fieldId = this.jiraOptions.fields?.testType;
        if (!fieldId) {
            fieldId = await this.getFieldId("test type", "testType");
        }
        // Field property example:
        // customfield_12100: {
        //   value: "Cucumber",
        //   id: "12702",
        //   disabled: false
        // }
        return await this.extractJiraField(
            fieldId,
            JiraRepository.OBJECT_VALUE_EXTRACTOR,
            ...issueKeys
        );
    }
}
