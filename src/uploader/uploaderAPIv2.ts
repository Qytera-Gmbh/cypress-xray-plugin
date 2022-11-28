import { URL_XRAY_V2 } from "../constants";
import { Uploader } from "../uploader";

export class APIv2Uploader extends Uploader {
    protected baseURL(): string {
        return URL_XRAY_V2;
    }

    private static toJSON(runResult: CypressCommandLine.RunResult): 

    public async upload(results: CypressCommandLine.CypressRunResult) {
        const xraySettings = await this.getXraySettings();
    }
}
