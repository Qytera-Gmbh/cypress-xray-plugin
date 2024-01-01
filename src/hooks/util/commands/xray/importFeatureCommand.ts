import { XrayClient } from "../../../../client/xray/xrayClient";
import { LOG, Level } from "../../../../logging/logging";
import { ImportFeatureResponse } from "../../../../types/xray/responses/importFeature";
import { dedent } from "../../../../util/dedent";
import { Command } from "../../../command";

export interface Parameters {
    file: string;
    projectKey?: string;
    projectId?: string;
    source?: string;
}

export class ImportFeatureCommand extends Command<ImportFeatureResponse> {
    private readonly xrayClient: XrayClient;
    private readonly parameters: Parameters;
    constructor(xrayClient: XrayClient, importParameters: Parameters) {
        super();
        this.xrayClient = xrayClient;
        this.parameters = importParameters;
    }

    /**
     * Returns the feature file's path relative to the project root.
     *
     * @returns the path
     */
    public getFilePath(): string {
        return this.parameters.file;
    }

    public getProjectKey(): string | undefined {
        return this.parameters.projectKey;
    }

    public getProjectId(): string | undefined {
        return this.parameters.projectId;
    }

    public getSource(): string | undefined {
        return this.parameters.source;
    }

    protected async computeResult(): Promise<ImportFeatureResponse> {
        LOG.message(Level.INFO, `Importing feature file to Xray: ${this.getFilePath()}`);
        const importResponse = await this.xrayClient.importFeature(
            this.parameters.file,
            this.parameters.projectKey,
            this.parameters.projectId,
            this.parameters.source
        );
        if (importResponse.errors.length > 0) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Encountered errors during feature file import:
                    ${importResponse.errors.map((error) => `- ${error}`).join("\n")}
                `)
            );
        }
        return importResponse;
    }
}
