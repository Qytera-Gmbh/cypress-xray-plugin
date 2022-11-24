import { URL_XRAY_V2 } from "../constants";
import { TestExecutionResult } from "../results";
import { Uploader } from "../uploader";

export class APIv2Uploader extends Uploader {
    protected baseURL(): string {
        return URL_XRAY_V2;
    }

    public async uploadTestExecution(result: TestExecutionResult) {
        const xraySettings = await this.getXraySettings();
        result.upload(
            xraySettings.url + "/import/execution/",
            this.getProjectKey(),
            xraySettings.token
        );
    }
}
