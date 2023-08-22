import { StringMap } from "../../types/util";

export abstract class FieldRepository {
    /**
     * Retrieve the description of all issues described by their key.
     *
     * @param issueKeys the keys of the issues
     * @returns a mapping of issue keys to descriptions
     */
    public abstract getDescription(
        ...issueKeys: string[]
    ): StringMap<string> | Promise<StringMap<string>>;

    /**
     * Retrieve the labels of all issues described by their key.
     *
     * @param issueKeys the keys of the issues
     * @returns a mapping of issue keys to labels
     */
    public abstract getLabels(
        ...issueKeys: string[]
    ): StringMap<string[]> | Promise<StringMap<string[]>>;

    /**
     * Retrieve the summaries of all issues described by their key.
     *
     * @param issueKeys the keys of the issues
     * @returns a mapping of issue keys to summaries
     */
    public abstract getSummary(
        ...issueKeys: string[]
    ): StringMap<string> | Promise<StringMap<string>>;

    /**
     * Retrieve the assigned test plan of all issues described by their key.
     *
     * @param issueKeys the keys of the issues
     * @returns a mapping of issue keys to test plan keys
     */
    public abstract getTestPlan(
        ...issueKeys: string[]
    ): StringMap<string> | Promise<StringMap<string>>;

    /**
     * Retrieve the test types of all issues described by their key.
     *
     * @param issueKeys the keys of the issues
     * @returns a mapping of issue keys to test types
     */
    public abstract getTestType(
        ...issueKeys: string[]
    ): StringMap<string> | Promise<StringMap<string>>;
}
