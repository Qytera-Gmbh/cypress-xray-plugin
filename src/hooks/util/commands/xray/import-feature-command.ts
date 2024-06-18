import { XrayClient } from "../../../../client/xray/xray-client";
import { ImportFeatureResponse } from "../../../../types/xray/responses/import-feature";
import { dedent } from "../../../../util/dedent";
import { Level } from "../../../../util/logging";
import { Command } from "../../../command";

interface Parameters {
    xrayClient: XrayClient;
    filePath: string;
    projectKey?: string;
    projectId?: string;
    source?: string;
}

export class ImportFeatureCommand extends Command<ImportFeatureResponse, Parameters> {
    protected async computeResult(): Promise<ImportFeatureResponse> {
        this.logger.message(
            Level.INFO,
            `Importing feature file to Xray: ${this.parameters.filePath}`
        );
        const importResponse = await this.parameters.xrayClient.importFeature(
            this.parameters.filePath,
            {
                projectKey: this.parameters.projectKey,
                projectId: this.parameters.projectId,
                source: this.parameters.source,
            }
        );
        if (importResponse.errors.length > 0) {
            this.logger.message(
                Level.WARNING,
                dedent(`
                    ${this.parameters.filePath}

                      Encountered errors during feature file import.

                      ${importResponse.errors.map((error) => `- ${error}`).join("\n")}
                `)
            );
        }
        return importResponse;
    }
}
