import { GherkinDocument } from "@cucumber/messages";
import { parseFeatureFile } from "../../preprocessing/preprocessing";
import { Command } from "../../util/command/command";

export class ParseFeatureFileCommand extends Command<GherkinDocument> {
    constructor(private readonly filePath: string) {
        super();
        this.filePath = filePath;
    }

    public getFilePath(): string {
        return this.filePath;
    }

    protected computeResult(): Promise<GherkinDocument> {
        return new Promise((resolve) => {
            resolve(parseFeatureFile(this.filePath));
        });
    }
}
