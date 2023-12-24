import { GherkinDocument } from "@cucumber/messages";
import { parseFeatureFile } from "../../preprocessing/preprocessing";
import { Command } from "../../util/command/command";

export class ParseFeatureFileCommand extends Command<GherkinDocument> {
    constructor(private readonly filePath: string) {
        super();
        this.filePath = filePath;
    }

    protected computeResult(): GherkinDocument {
        return parseFeatureFile(this.filePath);
    }
}
