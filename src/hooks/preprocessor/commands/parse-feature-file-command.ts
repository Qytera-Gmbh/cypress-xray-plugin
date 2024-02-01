import { GherkinDocument } from "@cucumber/messages";
import { LOG, Level } from "../../../util/logging";
import { Command } from "../../command";
import { parseFeatureFile } from "./parsing/gherkin";

interface Parameters {
    filePath: string;
}

export class ParseFeatureFileCommand extends Command<GherkinDocument, Parameters> {
    protected computeResult(): Promise<GherkinDocument> {
        return new Promise((resolve) => {
            LOG.message(Level.INFO, `Parsing feature file: ${this.parameters.filePath}`);
            resolve(parseFeatureFile(this.parameters.filePath));
        });
    }
}
