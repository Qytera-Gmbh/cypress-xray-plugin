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
import { dedent } from "../../util/dedent";
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
    public async convert(
        input: CucumberMultipartFeature[],
        parameters: ConversionParameters
    ): Promise<CucumberMultipart<CucumberMultipartInfoType>> {
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
                        dedent(`
                            Skipping result upload for ${element.type}: ${element.name}

                              ${reason}
                        `)
                    );
                }
            });
            if (elements.length > 0) {
                test.elements = elements;
                tests.push(test);
            }
        });
        try {
            const info: CucumberMultipartInfoType = await this.getMultipartInfo(parameters);
            return {
                features: tests,
                info: info,
            };
        } catch (error: unknown) {
            let reason = error;
            if (error instanceof Error) {
                reason = error.message;
            }
            logWarning(
                dedent(`
                    Skipping result upload for: ${tests.map((test) => test.name).join(", ")}

                      ${reason}
                `)
            );
            return {
                features: [],
                info: null,
            };
        }
    }

    /**
     * Build the test execution info object for this multipart conversion.
     *
     * @param parameters the conversion parameters
     * @returns the multipart information
     */
    protected abstract getMultipartInfo(
        parameters: ConversionParameters
    ): Promise<CucumberMultipartInfoType>;

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
