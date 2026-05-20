export interface FeatureFileIssueData {
    preconditions: FeatureFileIssueDataPrecondition[];
    tests: FeatureFileIssueDataTest[];
}

interface FeatureFileIssueDataTest {
    key: string;
    summary: string;
    tags: string[];
}

interface FeatureFileIssueDataPrecondition {
    key: string;
    summary: string;
}
