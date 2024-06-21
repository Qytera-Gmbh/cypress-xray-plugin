export interface FeatureFileIssueData {
    preconditions: FeatureFileIssueDataPrecondition[];
    tests: FeatureFileIssueDataTest[];
}

export interface FeatureFileIssueDataTest {
    key: string;
    summary: string;
    tags: string[];
}

export interface FeatureFileIssueDataPrecondition {
    key: string;
    summary: string;
}
