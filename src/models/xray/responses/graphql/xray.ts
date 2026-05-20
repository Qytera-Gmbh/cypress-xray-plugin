/* eslint-disable @typescript-eslint/naming-convention */

/*
 * Generated using: https://transform.tools/graphql-to-typescript
 * Some type parameters have been added manually.
 */
export interface Test<JiraDataType> {
    __typename?: "Test";
    folder?: Folder;
    gherkin?: string;
    issueId?: string;
    jira: JiraDataType;
    lastModified?: string;
    preconditions?: PreconditionResults<JiraDataType>;
    projectId?: string;
    scenarioType?: string;
    status?: TestStatusType;
    steps?: Step[];
    testExecutions?: TestExecutionResults<JiraDataType>;
    testPlans?: TestPlanResults<JiraDataType>;
    testRuns?: TestRunResults<JiraDataType>;
    testSets?: TestSetResults<JiraDataType>;
    testType?: TestType;
    unstructured?: string;
}

export interface TestPreconditionsArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestTestSetsArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestTestPlansArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestTestExecutionsArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestTestRunsArgs {
    limit: number;
    start?: number;
}

export interface TestJiraArgs {
    fields?: string[];
}

export interface TestStatusArgs {
    environment?: string;
    isFinal?: boolean;
    testPlan?: string;
    version?: string;
}

export interface TestType {
    __typename?: "TestType";
    id?: string;
    kind?: string;
    name?: string;
}

export interface Step {
    __typename?: "Step";
    action?: string;
    attachments?: Attachment[];
    callTestIssueId?: string;
    customFields?: CustomStepField[];
    data?: string;
    id?: string;
    result?: string;
}

export interface Folder {
    __typename?: "Folder";
    name?: string;
    path?: string;
}

export interface PreconditionResults<JiraDataType> {
    __typename?: "PreconditionResults";
    limit?: number;
    results?: Precondition<JiraDataType>[];
    start?: number;
    total?: number;
}

export interface TestSetResults<JiraDataType> {
    __typename?: "TestSetResults";
    limit?: number;
    results?: TestSet<JiraDataType>[];
    start?: number;
    total?: number;
}

export interface TestPlanResults<JiraDataType> {
    __typename?: "TestPlanResults";
    limit?: number;
    results?: TestPlan<JiraDataType>[];
    start?: number;
    total?: number;
}

export interface TestExecutionResults<JiraDataType> {
    __typename?: "TestExecutionResults";
    limit?: number;
    results?: TestExecution<JiraDataType>[];
    start?: number;
    total?: number;
}

export interface TestRunResults<JiraDataType> {
    __typename?: "TestRunResults";
    limit?: number;
    results?: TestRun<JiraDataType>[];
    start?: number;
    total?: number;
}

export interface TestStatusType {
    __typename?: "TestStatusType";
    color?: string;
    description?: string;
    final?: boolean;
    name?: string;
}

export interface Attachment {
    __typename?: "Attachment";
    downloadLink?: string;
    filename?: string;
    id?: string;
    storedInJira?: boolean;
}

export interface CustomStepField {
    __typename?: "CustomStepField";
    id?: string;
    name?: string;
    value?: unknown;
}

export interface Precondition<JiraDataType> {
    __typename?: "Precondition";
    definition?: string;
    folder?: Folder;
    issueId?: string;
    jira?: JiraDataType;
    lastModified?: string;
    preconditionType?: TestType;
    projectId?: string;
    tests?: TestResults<JiraDataType>;
}

export interface PreconditionTestsArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface PreconditionJiraArgs {
    fields?: string[];
}

export interface TestSet<JiraDataType> {
    __typename?: "TestSet";
    issueId?: string;
    jira?: JiraDataType;
    lastModified?: string;
    projectId?: string;
    tests?: TestResults<JiraDataType>;
}

export interface TestSetTestsArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestSetJiraArgs {
    fields?: string[];
}

export interface TestPlan<JiraDataType> {
    __typename?: "TestPlan";
    folders?: FolderResults;
    issueId?: string;
    jira?: JiraDataType;
    lastModified?: string;
    projectId?: string;
    testExecutions?: TestExecutionResults<JiraDataType>;
    tests?: TestResults<JiraDataType>;
}

export interface TestPlanTestsArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestPlanTestExecutionsArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestPlanJiraArgs {
    fields?: string[];
}

export interface TestExecution<JiraDataType> {
    __typename?: "TestExecution";
    issueId?: string;
    jira?: JiraDataType;
    lastModified?: string;
    projectId?: string;
    testEnvironments?: string[];
    testPlans?: TestPlanResults<JiraDataType>;
    testRuns?: TestRunResults<JiraDataType>;
    tests?: TestResults<JiraDataType>;
}

export interface TestExecutionTestsArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestExecutionTestPlansArgs {
    issueIds?: string[];
    limit: number;
    start?: number;
}

export interface TestExecutionTestRunsArgs {
    limit: number;
    start?: number;
}

export interface TestExecutionJiraArgs {
    fields?: string[];
}

export interface TestRun<JiraDataType> {
    __typename?: "TestRun";
    assigneeId?: string;
    comment?: string;
    customFields?: TestRunCustomFieldValue[];
    defects?: string[];
    evidence?: Evidence[];
    examples?: Example[];
    executedById?: string;
    finishedOn?: string;
    gherkin?: string;
    id?: string;
    iterations?: TestRunIterationResults;
    lastModified?: string;
    parameters?: TestRunParameter[];
    preconditions?: TestRunPreconditionResults<JiraDataType>;
    results?: Result[];
    scenarioType?: string;
    startedOn?: string;
    status?: Status;
    steps?: TestRunStep[];
    test?: Test<JiraDataType>;
    testExecution?: TestExecution<JiraDataType>;
    testType?: TestType;
    unstructured?: string;
}

export interface TestRunPreconditionsArgs {
    limit: number;
    start?: number;
}

export interface TestRunIterationsArgs {
    limit: number;
    start?: number;
}

export interface TestResults<JiraDataType> {
    __typename?: "TestResults";
    limit?: number;
    results?: Test<JiraDataType>[];
    start?: number;
    total?: number;
}

export interface FolderResults {
    __typename?: "FolderResults";
    folders?: unknown;
    issuesCount?: number;
    name?: string;
    path?: string;
    preconditionsCount?: number;
    testsCount?: number;
}

export interface Status {
    __typename?: "Status";
    color?: string;
    coverageStatus?: string;
    description?: string;
    final?: boolean;
    name?: string;
}

export interface Evidence {
    __typename?: "Evidence";
    createdOn?: string;
    downloadLink?: string;
    filename?: string;
    id?: string;
    size?: number;
    storedInJira?: boolean;
}

export interface TestRunStep {
    __typename?: "TestRunStep";
    action?: string;
    actualResult?: string;
    attachments?: Attachment[];
    comment?: string;
    customFields?: TestRunCustomStepField[];
    data?: string;
    defects?: string[];
    evidence?: Evidence[];
    id?: string;
    result?: string;
    status?: StepStatus;
}

export interface Example {
    __typename?: "Example";
    duration?: number;
    id?: string;
    status?: StepStatus;
}

export interface Result {
    __typename?: "Result";
    backgrounds?: ResultsStep[];
    duration?: number;
    examples?: ResultsExample[];
    hooks?: ResultsStep[];
    log?: string;
    name?: string;
    status?: StepStatus;
    steps?: ResultsStep[];
    wasImported?: string;
}

export interface TestRunPreconditionResults<JiraDataType> {
    __typename?: "TestRunPreconditionResults";
    limit?: number;
    results?: TestRunPrecondition<JiraDataType>[];
    start?: number;
    total?: number;
}

export interface TestRunCustomFieldValue {
    __typename?: "TestRunCustomFieldValue";
    id?: string;
    name?: string;
    values?: unknown;
}

export interface TestRunParameter {
    __typename?: "TestRunParameter";
    name?: string;
    value?: string;
}

export interface TestRunIterationResults {
    __typename?: "TestRunIterationResults";
    limit?: number;
    results?: TestRunIteration[];
    start?: number;
    total?: number;
}

export interface StepStatus {
    __typename?: "StepStatus";
    color?: string;
    description?: string;
    name?: string;
    testStatus?: Status;
}

export interface TestRunCustomStepField {
    __typename?: "TestRunCustomStepField";
    id?: string;
    name?: string;
    value?: unknown;
}

export interface ResultsExample {
    __typename?: "ResultsExample";
    backgrounds?: ResultsStep[];
    duration?: number;
    hooks?: ResultsStep[];
    status?: StepStatus;
    steps?: ResultsStep[];
    wasImported?: string;
}

export interface ResultsStep {
    __typename?: "ResultsStep";
    duration?: number;
    embeddings?: ResultsEmbedding[];
    error?: string;
    keyword?: string;
    log?: string;
    name?: string;
    status?: StepStatus;
}

export interface TestRunPrecondition<JiraDataType> {
    __typename?: "TestRunPrecondition";
    definition?: string;
    preconditionRef?: Precondition<JiraDataType>;
}

export interface TestRunIteration {
    __typename?: "TestRunIteration";
    parameters?: TestRunParameter[];
    rank?: string;
    status?: StepStatus;
    stepResults?: TestRunIterationStepResults;
}

export interface TestRunIterationStepResultsArgs {
    limit: number;
    start?: number;
}

export interface ResultsEmbedding {
    __typename?: "ResultsEmbedding";
    data?: string;
    downloadLink?: string;
    filename?: string;
    mimeType?: string;
}

export interface TestRunIterationStepResults {
    __typename?: "TestRunIterationStepResults";
    limit?: number;
    results?: TestRunIterationStepResult[];
    start?: number;
    total?: number;
}

export interface TestRunIterationStepResult {
    __typename?: "TestRunIterationStepResult";
    actualResult?: string;
    comment?: string;
    defects?: string[];
    evidence?: Evidence[];
    id?: string;
    status?: StepStatus;
}
