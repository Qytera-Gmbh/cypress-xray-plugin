import { logWarning } from "../../logging/logging";
import {
    CucumberMultipartElement,
    CucumberMultipartFeature,
    CucumberMultipartStep,
    CucumberMultipartTag,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/error";

export function getMultipartFeatures(
    input: CucumberMultipartFeature[],
    options?: {
        testExecutionIssueKey?: string;
        includeScreenshots?: boolean;
    }
) {
    const tests: CucumberMultipartFeature[] = [];
    input.forEach((result: CucumberMultipartFeature) => {
        const test: CucumberMultipartFeature = {
            ...result,
        };
        if (options?.testExecutionIssueKey) {
            // For feature tags, there's no Cloud/Server distinction for some reason.
            const testExecutionIssueTag: CucumberMultipartTag = {
                name: `@${options.testExecutionIssueKey}`,
            };
            // Xray uses the first encountered issue tag for deducing the test execution issue.
            if (result.tags) {
                test.tags = [testExecutionIssueTag, ...result.tags];
            } else {
                test.tags = [testExecutionIssueTag];
            }
        }
        const elements: CucumberMultipartElement[] = [];
        result.elements.forEach((element: CucumberMultipartElement) => {
            try {
                const modifiedElement: CucumberMultipartElement = {
                    ...element,
                    steps: getSteps(element, options?.includeScreenshots),
                };
                elements.push(modifiedElement);
            } catch (error: unknown) {
                logWarning(
                    dedent(`
                        Skipping result upload for ${element.type}: ${element.name}

                            ${errorMessage(error)}
                    `)
                );
            }
        });
        if (elements.length > 0) {
            test.elements = elements;
            tests.push(test);
        }
    });
    return tests;
}

function getSteps(
    element: CucumberMultipartElement,
    includeScreenshots?: boolean
): CucumberMultipartStep[] {
    const steps: CucumberMultipartStep[] = [];
    element.steps.forEach((step: CucumberMultipartStep) => {
        steps.push({
            ...step,
            embeddings: includeScreenshots ? step.embeddings : [],
        });
    });
    return steps;
}
