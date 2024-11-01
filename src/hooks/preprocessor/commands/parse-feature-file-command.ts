import type { GherkinDocument } from "@cucumber/messages";
import { dedent } from "../../../util/dedent.js";
import { errorMessage } from "../../../util/errors.js";
import { Level } from "../../../util/logging.js";
import { Command } from "../../command.js";
import { parseFeatureFile } from "./parsing/gherkin.js";

interface Parameters {
    filePath: string;
}

export class ParseFeatureFileCommand extends Command<GherkinDocument, Parameters> {
    protected computeResult(): GherkinDocument {
        try {
            this.logger.message(Level.INFO, `Parsing feature file: ${this.parameters.filePath}`);
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
