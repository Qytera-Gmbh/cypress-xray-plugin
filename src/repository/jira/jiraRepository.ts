import { LOG, Level } from "../../logging/logging";
import { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { IJiraFieldRepository } from "./fields/jiraFieldRepository";
import { IJiraIssueFetcher, SupportedFields } from "./fields/jiraIssueFetcher";

/**
 * An interface describing a Jira repository, which provides methods for retrieving issue data such
 * as summaries, descriptions, labels or test types.
 */
export interface IJiraRepository {
    /**
     * Retrieve the internal Jira ID of a field.
     *
     * @param fieldName - the field
     * @returns the field ID
     * @see https://confluence.atlassian.com/jirakb/how-to-find-id-for-custom-field-s-744522503.html
     */
    getFieldId(fieldName: SupportedFields): Promise<string>;
    /**
     * Retrieve the descriptions of all provided issues, represented through their Jira issue keys.
     *
     * @param issueKeys - the issue keys
     * @returns a mapping of issue keys to issue descriptions
     */
    getDescriptions(...issueKeys: string[]): Promise<StringMap<string>>;
    /**
     * Retrieve the labels of all provided issues, represented through their Jira issue keys.
     *
     * @param issueKeys - the issue keys
     * @returns a mapping of issue keys to issue labels
     */
    getLabels(...issueKeys: string[]): Promise<StringMap<string[]>>;
    /**
     * Retrieve the summaries of all provided issues, represented through their Jira issue keys.
     *
     * @param issueKeys - the issue keys
     * @returns a mapping of issue keys to issue summaries
     */
    getSummaries(...issueKeys: string[]): Promise<StringMap<string>>;
    /**
     * Retrieve the test types of all provided test issues, represented through their Jira issue
     * keys.
     *
     * @param issueKeys - the issue keys
     * @returns a mapping of issue keys to test issue types
     * @see https://docs.getxray.app/display/ON/Enabling+Xray+Issue+Types
     */
    getTestTypes(...issueKeys: string[]): Promise<StringMap<string>>;
}

/**
 * A Jira repository which caches retrieved data. Caching means that live issue information is only
 * retrieved for the first request. All subsequent accesses will then return the cached value.
 */
export class CachingJiraRepository implements IJiraRepository {
    private readonly summaries: StringMap<string> = {};
    private readonly descriptions: StringMap<string> = {};
    private readonly testTypes: StringMap<string> = {};
    private readonly labels: StringMap<string[]> = {};

    /**
     * Construct a new caching Jira repository. It relies on an internal field repository and an
     * issue data fetcher for information retrieval.
     *
     * @param jiraFieldRepository - the Jira field repository
     * @param jiraIssueFetcher - the Jira issue fetcher
     */
    constructor(
        protected readonly jiraFieldRepository: IJiraFieldRepository,
        protected readonly jiraIssueFetcher: IJiraIssueFetcher
    ) {}

    public async getFieldId(fieldName: SupportedFields): Promise<string> {
        return this.jiraFieldRepository.getFieldId(fieldName);
    }

    public async getSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        let result: StringMap<string> = {};
        try {
            result = await this.mergeRemainingFields(
                this.summaries,
                this.jiraIssueFetcher.fetchSummaries.bind(this.jiraIssueFetcher),
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
            LOG.message(
                Level.ERROR,
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
                this.jiraIssueFetcher.fetchDescriptions.bind(this.jiraIssueFetcher),
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
            LOG.message(
                Level.ERROR,
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
                this.jiraIssueFetcher.fetchTestTypes.bind(this.jiraIssueFetcher),
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
            LOG.message(
                Level.ERROR,
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
                this.jiraIssueFetcher.fetchLabels.bind(this.jiraIssueFetcher),
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
            LOG.message(
                Level.ERROR,
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
