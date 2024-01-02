import { XrayClientCloud } from "../../../../client/xray/xray-client-cloud";
import { Issue } from "../../../../types/jira/responses/issue";
import { StringMap } from "../../../../types/util";
import { dedent } from "../../../../util/dedent";
import { extractNestedString } from "../../../../util/extraction";
import { LOG, Level } from "../../../../util/logging";
import { Command, Computable } from "../../../command";
import { JiraField } from "./extract-field-id-command";
import { GetFieldValuesCommand } from "./get-field-values-command";

export class GetTestTypeValuesCommandServer extends GetFieldValuesCommand<JiraField.TEST_TYPE> {
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
    private readonly projectKey: string;
    private readonly xrayClient: XrayClientCloud;
    private readonly issueKeys: Computable<string[]>;
    constructor(projectKey: string, xrayClient: XrayClientCloud, issueKeys: Computable<string[]>) {
        super();
        this.projectKey = projectKey;
        this.xrayClient = xrayClient;
        this.issueKeys = issueKeys;
    }

    protected async computeResult(): Promise<StringMap<string>> {
        const issueKeys = await this.issueKeys.compute();
        const testTypes = await this.xrayClient.getTestTypes(this.projectKey, ...issueKeys);
        const missingTypes = issueKeys.filter((key) => !(key in testTypes));
        if (missingTypes.length > 0) {
            missingTypes.sort();
            LOG.message(
                Level.WARNING,
                dedent(`
                    Failed to retrieve test types of issues:

                      ${missingTypes.join("\n")}
                `)
            );
        }
        return testTypes;
    }
}
