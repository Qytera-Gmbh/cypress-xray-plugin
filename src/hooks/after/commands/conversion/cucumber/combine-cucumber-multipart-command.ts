import type {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../../../../types/xray/requests/import-execution-cucumber-multipart.js";
import type { MultipartInfo } from "../../../../../types/xray/requests/import-execution-multipart-info.js";
import type { Logger } from "../../../../../util/logging.js";
import type { Computable } from "../../../../command.js";
import { Command } from "../../../../command.js";

export class CombineCucumberMultipartCommand extends Command<CucumberMultipart, null> {
    private readonly cucumberMultipartInfo: Computable<MultipartInfo>;
    private readonly cucumberMultipartFeatures: Computable<CucumberMultipartFeature[]>;

    constructor(
        logger: Logger,
        cucumberMultipartInfo: Computable<MultipartInfo>,
        cucumberMultipartFeatures: Computable<CucumberMultipartFeature[]>
    ) {
        super(null, logger);
        this.cucumberMultipartInfo = cucumberMultipartInfo;
        this.cucumberMultipartFeatures = cucumberMultipartFeatures;
    }

    protected async computeResult(): Promise<CucumberMultipart> {
        const cucumberMultipartInfo = await this.cucumberMultipartInfo.compute();
        const cucumberMultipartFeatures = await this.cucumberMultipartFeatures.compute();
        return {
            features: cucumberMultipartFeatures,
            info: cucumberMultipartInfo,
        };
    }
}
