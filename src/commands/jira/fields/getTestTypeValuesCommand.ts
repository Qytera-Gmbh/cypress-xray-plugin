import { IJiraClient } from "../../../client/jira/jiraClient";
import { IXrayClientCloud } from "../../../client/xray/xrayClientCloud";
import { IIssue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { Computable } from "../../../util/command/command";
import { extractNestedString } from "../../../util/extraction";
import { GetFieldValuesCommand } from "./getFieldValuesCommand";

export class GetTestTypeValuesCommandServer extends GetFieldValuesCommand<string> {
    constructor(
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>,
        private readonly jiraClient: IJiraClient
    ) {
        super(fieldId, issueKeys);
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<StringMap<string>> {
        // Field property example:
        // customfield_12100: {
        //   value: "Cucumber",
        //   id: "12702",
        //   disabled: false
        // }
        return await this.extractJiraFieldValues(
            this.jiraClient,
            (issue: IIssue, fieldId: string) =>
                extractNestedString(issue.fields, [fieldId, "value"])
        );
    }
}

export class GetTestTypeValuesCommandCloud extends GetFieldValuesCommand<string> {
    constructor(
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>,
        private readonly projectKey: string,
        private readonly xrayClient: IXrayClientCloud
    ) {
        super(fieldId, issueKeys);
        this.projectKey = projectKey;
        this.xrayClient = xrayClient;
    }

    protected async computeResult(): Promise<StringMap<string>> {
        const issueKeys = await this.issueKeys.getResult();
        return await this.xrayClient.getTestTypes(this.projectKey, ...issueKeys);
    }
}
