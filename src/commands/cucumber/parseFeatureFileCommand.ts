import { GherkinDocument } from "@cucumber/messages";
import { parseFeatureFile } from "../../preprocessing/preprocessing";
import { Command } from "../command";

export class ParseFeatureFileCommand extends Command<GherkinDocument> {
    private readonly filePath: string;
    constructor(filePath: string) {
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
