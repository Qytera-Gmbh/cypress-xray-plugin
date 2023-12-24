import { IXrayClient } from "../../client/xray/xrayClient";
import { ImportFeatureResponse } from "../../types/xray/responses/importFeature";
import { Command } from "../../util/command/command";

export class ImportFeatureCommand extends Command<ImportFeatureResponse> {
    constructor(
        private readonly xrayClient: IXrayClient,
        private readonly file: string,
        private readonly projectKey?: string,
        private readonly projectId?: string,
        private readonly source?: string
    ) {
        super();
        this.xrayClient = xrayClient;
        this.file = file;
        this.projectKey = projectKey;
        this.projectId = projectId;
        this.source = source;
    }

    protected async computeResult(): Promise<ImportFeatureResponse> {
        return await this.xrayClient.importFeature(
            this.file,
            this.projectKey,
            this.projectId,
            this.source
        );
    }
}
