import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { StringMap } from "../../types/util";
import { JiraRepository } from "./jiraRepository";

export class JiraRepositoryServer extends JiraRepository<JiraClientServer, XrayClientServer> {
    protected async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        let fieldId = this.options.jira.fields?.testType?.id;
        if (!fieldId) {
            const fieldName = this.options.jira.fields?.testType?.name ?? "test type";
            fieldId = await this.getFieldId(fieldName);
        }
        // Field property example:
        // customfield_12100: {
        //   value: "Cucumber",
        //   id: "12702",
        //   disabled: false
        // }
        return await this.getJiraField(
            fieldId,
            JiraRepository.OBJECT_VALUE_EXTRACTOR,
            ...issueKeys
        );
    }
}
