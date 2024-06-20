export interface FeatureFileIssueData {
    tests: FeatureFileIssueDataTest[];
    preconditions: FeatureFileIssueDataPrecondition[];
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
