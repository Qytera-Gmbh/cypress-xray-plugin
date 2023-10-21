import { logError } from "../../logging/logging";
import { InternalJiraOptions, JiraFieldIds } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { IJiraFieldRepository } from "./fields/jiraFieldRepository";
import { IJiraIssueFetcher, SupportedFields } from "./fields/jiraIssueFetcher";

export interface IJiraRepository {
    getFieldId(fieldName: SupportedFields, optionName: keyof JiraFieldIds): Promise<string>;
    getSummaries(...issueKeys: string[]): Promise<StringMap<string>>;
    getDescriptions(...issueKeys: string[]): Promise<StringMap<string>>;
    getTestTypes(...issueKeys: string[]): Promise<StringMap<string>>;
    getLabels(...issueKeys: string[]): Promise<StringMap<string[]>>;
}

export class JiraRepository implements IJiraRepository {
    protected readonly jiraFieldRepository: IJiraFieldRepository;
    protected readonly jiraFieldFetcher: IJiraIssueFetcher;
    protected readonly jiraOptions: InternalJiraOptions;

    private readonly summaries: StringMap<string> = {};
    private readonly descriptions: StringMap<string> = {};
    private readonly testTypes: StringMap<string> = {};
    private readonly labels: StringMap<string[]> = {};

    constructor(
        jiraFieldRepository: IJiraFieldRepository,
        jiraFieldFetcher: IJiraIssueFetcher,
        jiraOptions: InternalJiraOptions
    ) {
        this.jiraFieldRepository = jiraFieldRepository;
        this.jiraFieldFetcher = jiraFieldFetcher;
        this.jiraOptions = jiraOptions;
    }

    public async getFieldId(fieldName: SupportedFields): Promise<string> {
        return this.jiraFieldRepository.getFieldId(fieldName);
    }

    public async getSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        let result: StringMap<string> = {};
        try {
            result = await this.mergeRemainingFields(
                this.summaries,
                this.jiraFieldFetcher.fetchSummaries,
                ...issueKeys
            );
            const missingSummaries: string[] = issueKeys.filter(
                (key: string) => !(key in this.summaries)
            );
            if (missingSummaries.length > 0) {
                throw new Error(
                    dedent(`
                        Make sure these issues exist:

                          ${missingSummaries.join("\n")}
                    `)
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue summaries
                    ${errorMessage(error)}
                `)
            );
        }
        return result;
    }

    public async getDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        let result: StringMap<string> = {};
        try {
            result = await this.mergeRemainingFields(
                this.descriptions,
                this.jiraFieldFetcher.fetchDescriptions,
                ...issueKeys
            );
            const missingDescriptions: string[] = issueKeys.filter(
                (key: string) => !(key in this.descriptions)
            );
            if (missingDescriptions.length > 0) {
                throw new Error(
                    dedent(`
                        Make sure these issues exist:

                          ${missingDescriptions.join("\n")}
                    `)
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue descriptions
                    ${errorMessage(error)}
                `)
            );
        }
        return result;
    }

    public async getTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        let result: StringMap<string> = {};
        try {
            result = await this.mergeRemainingFields(
                this.testTypes,
                this.jiraFieldFetcher.fetchTestTypes,
                ...issueKeys
            );
            const missingTestTypes: string[] = issueKeys.filter(
                (key: string) => !(key in this.testTypes)
            );
            if (missingTestTypes.length > 0) {
                throw new Error(
                    dedent(`
                        Make sure these issues exist and are test issues:

                          ${missingTestTypes.join("\n")}
                    `)
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue test types
                    ${errorMessage(error)}
                `)
            );
        }
        return result;
    }

    public async getLabels(...issueKeys: string[]): Promise<StringMap<string[]>> {
        let result: StringMap<string[]> = {};
        try {
            result = await this.mergeRemainingFields(
                this.labels,
                this.jiraFieldFetcher.fetchLabels,
                ...issueKeys
            );
            const missingLabels: string[] = issueKeys.filter(
                (key: string) => !(key in this.labels)
            );
            if (missingLabels.length > 0) {
                throw new Error(
                    dedent(`
                        Make sure these issues exist:

                          ${missingLabels.join("\n")}
                    `)
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue labels
                    ${errorMessage(error)}
                `)
            );
        }
        return result;
    }

    private async mergeRemainingFields<T>(
        knownFields: StringMap<T>,
        fetcher: (...issueKeys: string[]) => Promise<StringMap<T>>,
        ...issueKeys: string[]
    ): Promise<StringMap<T>> {
        const issuesWithMissingField: string[] = issueKeys.filter(
            (key: string) => !(key in knownFields)
        );
        if (issuesWithMissingField.length > 0) {
            const fetchedFields = await fetcher(...issuesWithMissingField);
            issueKeys.forEach((key: string) => {
                if (key in fetchedFields) {
                    knownFields[key] = fetchedFields[key];
                }
            });
        }
        const result: StringMap<T> = {};
        issueKeys.forEach((key: string) => {
            if (key in knownFields) {
                result[key] = knownFields[key];
            }
        });
        return result;
    }
}
