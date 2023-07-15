import { logWarning } from "../../logging/logging";
import {
    CucumberMultipart,
    CucumberMultipartElement,
    CucumberMultipartFeature,
    CucumberMultipartStep,
    CucumberMultipartTag,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import {
    CucumberMultipartInfoCloud,
    CucumberMultipartInfoServer,
} from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { Converter } from "../converter";

/**
 * This type provides lots of information which the converters require for results conversion. The
 * properties `runs` and `config` are excluded because in the scope of the converters, they have
 * been replaced with the Cucumber JSON and the plugin's options respectively.
 */
export type ConversionParameters = Omit<CypressCommandLine.CypressRunResult, "runs" | "config">;

export abstract class ImportExecutionCucumberMultipartConverter<
    CucumberMultipartInfoType extends CucumberMultipartInfoServer & CucumberMultipartInfoCloud
> extends Converter<
    CucumberMultipartFeature[],
    CucumberMultipart<CucumberMultipartInfoType>,
    ConversionParameters
> {
    public convert(
        input: CucumberMultipartFeature[],
        parameters: ConversionParameters
    ): CucumberMultipart<CucumberMultipartInfoType> {
        const tests: CucumberMultipartFeature[] = [];
        input.forEach((result: CucumberMultipartFeature) => {
            const test: CucumberMultipartFeature = {
                ...result,
            };
            if (this.options.jira.testExecutionIssueKey) {
                // For feature tags, there's no Cloud/Server distinction for some reason.
                const testExecutionIssueTag: CucumberMultipartTag = {
                    name: `@${this.options.jira.testExecutionIssueKey}`,
                };
                // Xray uses the first encountered issue tag for deducing the test execution issue.
                test.tags = [testExecutionIssueTag, ...result.tags];
            }
            const elements: CucumberMultipartElement[] = [];
            result.elements.forEach((element: CucumberMultipartElement) => {
                try {
                    if (
                        !this.options.jira.createTestIssues &&
                        !this.containsTestTag(element.tags)
                    ) {
                        throw new Error(
                            `No test issue key found in ${element.type} tags and the plugin is not allowed to create new test issues`
                        );
                    }
                    const modifiedElement: CucumberMultipartElement = {
                        ...element,
                        steps: this.getSteps(element),
                    };
                    elements.push(modifiedElement);
                } catch (error: unknown) {
                    let reason = error;
                    if (error instanceof Error) {
                        reason = error.message;
                    }
                    logWarning(
                        `${reason}. Skipping result upload for ${element.type}: ${element.name}`
                    );
                }
            });
            if (elements.length > 0) {
                test.elements = elements;
                tests.push(test);
            }
        });
        const info: CucumberMultipartInfoType = this.getMultipartInfo(parameters);
        return {
            features: tests,
            info: info,
        };
    }

    /**
     * Build the test execution info object for this multipart conversion.
     *
     * @param parameters the conversion parameters
     * @returns the multipart information
     */
    protected abstract getMultipartInfo(
        parameters: ConversionParameters
    ): CucumberMultipartInfoType;

    /**
     * Returns whether the array of tags contains a tag (potentially) describing a test issue.
     *
     * @param tags the tags
     * @returns true if the array contains such a tag, false otherwise
     */
    protected abstract containsTestTag(tags: CucumberMultipartTag[]): boolean;

    private getSteps(element: CucumberMultipartElement): CucumberMultipartStep[] {
        const steps: CucumberMultipartStep[] = [];
        element.steps.forEach((step: CucumberMultipartStep) => {
            steps.push({
                ...step,
                embeddings: this.options.xray.uploadScreenshots ? step.embeddings : [],
            });
        });
        return steps;
    }
}
