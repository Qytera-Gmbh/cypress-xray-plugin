import {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { CucumberMultipartInfo } from "../../../../../types/xray/requests/import-execution-cucumber-multipart-info";
import { Command, CommandDescription, Computable } from "../../../../command";

export class CombineCucumberMultipartCommand extends Command<CucumberMultipart, void> {
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

    public getDescription(): CommandDescription {
        return {
            description:
                "Combines information about a Jira test execution issue with a Cucumber report in preparation for an upload to Xray.",
            runtimeInputs: ["the Jira test execution issue information", "the Cucumber report"],
        };
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
