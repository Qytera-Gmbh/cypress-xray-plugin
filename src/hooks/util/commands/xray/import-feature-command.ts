import type { XrayClient } from "../../../../client/xray/xray-client.js";
import type { ImportFeatureResponse } from "../../../../types/xray/responses/import-feature.js";
import { dedent } from "../../../../util/dedent.js";
import { Level } from "../../../../util/logging.js";
import { Command } from "../../../command.js";

interface Parameters {
    filePath: string;
    projectId?: string;
    projectKey?: string;
    source?: string;
    xrayClient: XrayClient;
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
                projectId: this.parameters.projectId,
                projectKey: this.parameters.projectKey,
                source: this.parameters.source,
            }
        );
        if (importResponse.errors.length > 0) {
            this.logger.message(
                Level.WARNING,
                dedent(`
                    ${this.parameters.filePath}

                      Encountered errors during feature file import:
                      ${importResponse.errors.map((error) => `- ${error}`).join("\n")}
                `)
            );
        }
        return importResponse;
    }
}
