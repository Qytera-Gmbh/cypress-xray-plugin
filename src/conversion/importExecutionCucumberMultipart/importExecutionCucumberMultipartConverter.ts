import { logWarning } from "../../logging/logging";
import { InternalOptions } from "../../types/plugin";
import {
    CucumberMultipart,
    CucumberMultipartElement,
    CucumberMultipartFeature,
    CucumberMultipartTag,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import {
    CucumberMultipartInfoCloud,
    CucumberMultipartInfoServer,
} from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { Converter } from "../converter";

export abstract class ImportExecutionCucumberMultipartConverter<
    CucumberMultipartInfoType extends CucumberMultipartInfoServer & CucumberMultipartInfoCloud
> extends Converter<CucumberMultipartFeature[], CucumberMultipart<CucumberMultipartInfoType>> {
    /**
     * The timestamp when Cypress began testing.
     */
    protected readonly startedTestsAt: string;
    /**
     * Create a new converter for transforming Cucumber JSON reports into an Xray Cucumber multipart
     * request.
     *
     * @param options the configured plugin options.
     * @param startedTestsAt the timestamp when Cypress began testing
     */
    constructor(options: InternalOptions, startedTestsAt: string) {
        super(options);
        this.startedTestsAt = startedTestsAt;
    }

    public convert(
        input: CucumberMultipartFeature[]
    ): CucumberMultipart<CucumberMultipartInfoType> {
        const tests: CucumberMultipartFeature[] = [];
        input.forEach((result: CucumberMultipartFeature) => {
            const test: CucumberMultipartFeature = {
                ...result,
            };
            if (this.options.jira.testExecutionIssueKey) {
                // This time, there's no Cloud/Server distinction for some reason.
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
                    elements.push(element);
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
        const info: CucumberMultipartInfoType = this.getMultipartInfo();
        return {
            features: tests,
            info: info,
        };
    }

    /**
     * Build the test execution info object for this multipart conversion.
     *
     * @returns the multipart information
     */
    protected abstract getMultipartInfo(): CucumberMultipartInfoType;

    /**
     * Returns whether the array of tags contains a tag (potentially) describing a test issue.
     *
     * @param tags the tags
     * @returns true if the array contains such a tag, false otherwise
     */
    protected abstract containsTestTag(tags: CucumberMultipartTag[]): boolean;
}
