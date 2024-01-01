import { GherkinDocument } from "@cucumber/messages";
import { LOG, Level } from "../../../util/logging";
import { parseFeatureFile } from "../../../util/preprocessing";
import { Command } from "../../command";

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
        return new Promise((resolve, reject) => {
            LOG.message(Level.INFO, `Parsing feature file: ${this.getFilePath()}`);
            try {
                resolve(parseFeatureFile(this.filePath));
            } catch (error: unknown) {
                reject(error);
            }
        });
    }
}
