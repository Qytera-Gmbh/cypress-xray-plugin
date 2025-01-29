import type { XrayClient } from "../../../../client/xray/xray-client";
import type { ImportFeatureResponse } from "../../../../types/xray/responses/import-feature";
import { dedent } from "../../../../util/dedent";
import { Command } from "../../../command";

interface Parameters {
    filePath: string;
    projectId?: string;
    projectKey?: string;
    source?: string;
    xrayClient: XrayClient;
}

export class ImportFeatureCommand extends Command<ImportFeatureResponse, Parameters> {
    protected async computeResult(): Promise<ImportFeatureResponse> {
        this.logger.message("info", `Importing feature file to Xray: ${this.parameters.filePath}`);
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
                "warning",
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
