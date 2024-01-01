import {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../../../../types/xray/requests/importExecutionCucumberMultipart";
import { CucumberMultipartInfo } from "../../../../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { Command, Computable } from "../../../../command";

export class CombineCucumberMultipartCommand extends Command<CucumberMultipart> {
    private readonly cucumberMultipartInfo: Computable<CucumberMultipartInfo>;
    private readonly cucumberMultipartFeatures: Computable<CucumberMultipartFeature[]>;

    constructor(
        cucumberMultipartInfo: Computable<CucumberMultipartInfo>,
        cucumberMultipartFeatures: Computable<CucumberMultipartFeature[]>
    ) {
        super();
        this.cucumberMultipartInfo = cucumberMultipartInfo;
        this.cucumberMultipartFeatures = cucumberMultipartFeatures;
    }

    protected async computeResult(): Promise<CucumberMultipart> {
        const cucumberMultipartInfo = await this.cucumberMultipartInfo.compute();
        const cucumberMultipartFeatures = await this.cucumberMultipartFeatures.compute();
        return {
            info: cucumberMultipartInfo,
            features: cucumberMultipartFeatures,
        };
    }
}
