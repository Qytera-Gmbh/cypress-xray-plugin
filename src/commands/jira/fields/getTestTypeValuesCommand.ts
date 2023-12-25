import { XrayClientCloud } from "../../../client/xray/xrayClientCloud";
import { SupportedField } from "../../../repository/jira/fields/jiraIssueFetcher";
import { Issue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { Command, Computable } from "../../../util/command/command";
import { extractNestedString } from "../../../util/extraction";
import { GetFieldValuesCommand } from "./getFieldValuesCommand";

export class GetTestTypeValuesCommandServer extends GetFieldValuesCommand<SupportedField.TEST_TYPE> {
    protected async computeResult(): Promise<StringMap<string>> {
        // Field property example:
        // customfield_12100: {
        //   value: "Cucumber",
        //   id: "12702",
        //   disabled: false
        // }
        return await this.extractJiraFieldValues((issue: Issue, fieldId: string) =>
            extractNestedString(issue.fields, [fieldId, "value"])
        );
    }
}

export class GetTestTypeValuesCommandCloud extends Command<StringMap<string>> {
    constructor(
        private readonly projectKey: string,
        private readonly xrayClient: XrayClientCloud,
        private readonly issueKeys: Computable<string[]>
    ) {
        super();
        this.projectKey = projectKey;
        this.xrayClient = xrayClient;
        this.issueKeys = issueKeys;
    }

    protected async computeResult(): Promise<StringMap<string>> {
        const issueKeys = await this.issueKeys.getResult();
        return await this.xrayClient.getTestTypes(this.projectKey, ...issueKeys);
    }
}
