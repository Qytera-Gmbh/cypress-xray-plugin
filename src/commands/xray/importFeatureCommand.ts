import { XrayClient } from "../../client/xray/xrayClient";
import { ImportFeatureResponse } from "../../types/xray/responses/importFeature";
import { Command } from "../../util/command/command";

export class ImportFeatureCommand extends Command<ImportFeatureResponse> {
    constructor(
        private readonly xrayClient: XrayClient,
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

    public getFilePath(): string {
        return this.file;
    }

    public getProjectKey(): string | undefined {
        return this.projectKey;
    }

    public getProjectId(): string | undefined {
        return this.projectId;
    }

    public getSource(): string | undefined {
        return this.source;
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
