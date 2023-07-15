import {
    CucumberMultipart,
    CucumberMultipartFeature,
    CucumberMultipartTag,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import { Converter } from "../converter";

export abstract class ImportExecutionCucumberMultipartConverter<
    CucumberMultipartInfoType
> extends Converter<CucumberMultipartFeature[], CucumberMultipart<CucumberMultipartInfoType>> {
    public convert(
        input: CucumberMultipartFeature[]
    ): CucumberMultipart<CucumberMultipartInfoType> {
        if (this.options.jira.testExecutionIssueKey) {
            const testExecutionIssueTag: CucumberMultipartTag = {
                name: `@${this.options.jira.testExecutionIssueKey}`,
            };
            input.forEach((result: CucumberMultipartFeature) => {
                if (result.tags) {
                    result.tags = [];
                }
                // Xray uses the first encountered issue tag for deducing the test execution issue.
                result.tags = [testExecutionIssueTag, ...result.tags];
            });
        }
        return {
            features: input,
            info: this.getMultipartInfo(),
        };
    }

    /**
     * Build the test execution info object for this multipart conversion.
     *
     * @returns the multipart information
     */
    protected abstract getMultipartInfo(): CucumberMultipartInfoType;
}
