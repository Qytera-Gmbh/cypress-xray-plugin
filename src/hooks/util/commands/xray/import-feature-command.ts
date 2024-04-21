import { XrayClient } from "../../../../client/xray/xray-client";
import { ImportFeatureResponse } from "../../../../types/xray/responses/import-feature";
import { dedent } from "../../../../util/dedent";
import { LOG, Level } from "../../../../util/logging";
import { Command, CommandDescription } from "../../../command";

interface Parameters {
    xrayClient: XrayClient;
    filePath: string;
    projectKey?: string;
    projectId?: string;
    source?: string;
}

export class ImportFeatureCommand extends Command<ImportFeatureResponse, Parameters> {
    public getDescription(): CommandDescription {
        return {
            description: "Imports a Gherkin feature file to Xray.",
            runtimeInputs: [],
        };
    }

    protected async computeResult(): Promise<ImportFeatureResponse> {
        LOG.message(Level.INFO, `Importing feature file to Xray: ${this.parameters.filePath}`);
        const importResponse = await this.parameters.xrayClient.importFeature(
            this.parameters.filePath,
            {
                projectKey: this.parameters.projectKey,
                projectId: this.parameters.projectId,
                source: this.parameters.source,
            }
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
