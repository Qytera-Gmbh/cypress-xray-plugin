import type { GherkinDocument } from "@cucumber/messages";
import { dedent } from "../../../util/dedent";
import { errorMessage } from "../../../util/errors";
import { Command } from "../../command";
import { parseFeatureFile } from "./parsing/gherkin";

interface Parameters {
    filePath: string;
}

export class ParseFeatureFileCommand extends Command<GherkinDocument, Parameters> {
    protected computeResult(): GherkinDocument {
        try {
            this.logger.message("info", `Parsing feature file: ${this.parameters.filePath}`);
            return parseFeatureFile(this.parameters.filePath);
        } catch (error: unknown) {
            throw new Error(
                dedent(`
                    ${this.parameters.filePath}

                      Failed to parse feature file.

                        ${errorMessage(error)}
                `)
            );
        }
    }
}
