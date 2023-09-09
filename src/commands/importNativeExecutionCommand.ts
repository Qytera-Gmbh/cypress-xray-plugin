import { getNativeTestIssueKeys } from "../preprocessing/preprocessing";
import { JiraIssueStore } from "../repository/jira/jiraIssueStoreAsync";
import { InternalOptions, JiraFieldIds } from "../types/plugin";
import { StringMap } from "../types/util";
import { Command } from "./command";

interface IssueData {
    [testKey: string]: JiraFieldIds;
}

class ImportNativeExecutionCommand extends Command {
    private readonly options: InternalOptions;
    private readonly results: CypressCommandLine.CypressRunResult;
    private readonly jiraIssueRepository: JiraIssueStore;

    constructor(options: InternalOptions, results: CypressCommandLine.CypressRunResult) {
        super();
        this.options = options;
        this.results = results;
        this.jiraIssueRepository = new JiraIssueStoreAsyncCloud();
    }

    public async execute(): Promise<void> {
        const testKeys = getNativeTestIssueKeys(this.results, this.options);
        if (testKeys.length === 0) {
            throw new Error("TODO");
        }
        const issueData: IssueData = {};
        const issueDataRetrieval: Promise<void>[] = [];
        if (this.options.xray?.steps?.update) {
            const fetchSummaries = async () => {
                const summaries: StringMap<string> = await this.jiraIssueRepository.order(
                    "summary",
                    ...testKeys
                );
                Object.entries(summaries).forEach(([issueKey, summary]) => {
                    if (issueKey in issueData) {
                        issueData[issueKey].summary = summary;
                    } else {
                        issueData[issueKey] = {
                            summary: summary,
                        };
                    }
                });
            };
            issueDataRetrieval.push(fetchSummaries());
            const fetchTestTypes = async () => {
                const testTypes: StringMap<string> = await this.jiraIssueRepository.order(
                    "testType",
                    ...testKeys
                );
                Object.entries(testTypes).forEach(([issueKey, testType]) => {
                    if (issueKey in issueData) {
                        issueData[issueKey].testType = testType;
                    } else {
                        issueData[issueKey] = {
                            testType: testType,
                        };
                    }
                });
            };
            issueDataRetrieval.push(fetchTestTypes());
        }
        await Promise.all(issueDataRetrieval);
        console.log(issueData);
        throw new Error("Method not implemented.");
    }
}
