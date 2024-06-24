/* eslint-disable @typescript-eslint/naming-convention */

/*
 * Generated using: https://transform.tools/graphql-to-typescript
 * Some type parameters have been added manually.
 */
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
    Boolean: { input: boolean; output: boolean };
    Float: { input: number; output: number };
    ID: { input: string; output: string };
    Int: { input: number; output: number };
    JSON: { input: unknown; output: unknown };
    String: { input: string; output: string };
}

export interface Test<JiraDataType> {
    __typename?: "Test";
    folder?: Folder;
    gherkin?: Scalars["String"]["output"];
    issueId?: Scalars["String"]["output"];
    jira: JiraDataType;
    lastModified?: Scalars["String"]["output"];
    preconditions?: PreconditionResults<JiraDataType>;
    projectId?: Scalars["String"]["output"];
    scenarioType?: Scalars["String"]["output"];
    status?: TestStatusType;
    steps?: Step[];
    testExecutions?: TestExecutionResults<JiraDataType>;
    testPlans?: TestPlanResults<JiraDataType>;
    testRuns?: TestRunResults<JiraDataType>;
    testSets?: TestSetResults<JiraDataType>;
    testType?: TestType;
    unstructured?: Scalars["String"]["output"];
}

export interface TestPreconditionsArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestTestSetsArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestTestPlansArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestTestExecutionsArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestTestRunsArgs {
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestJiraArgs {
    fields?: Scalars["String"]["input"][];
}

export interface TestStatusArgs {
    environment?: Scalars["String"]["input"];
    isFinal?: Scalars["Boolean"]["input"];
    testPlan?: Scalars["String"]["input"];
    version?: Scalars["String"]["input"];
}

export interface TestType {
    __typename?: "TestType";
    id?: Scalars["String"]["output"];
    kind?: Scalars["String"]["output"];
    name?: Scalars["String"]["output"];
}

export interface Step {
    __typename?: "Step";
    action?: Scalars["String"]["output"];
    attachments?: Attachment[];
    callTestIssueId?: Scalars["String"]["output"];
    customFields?: CustomStepField[];
    data?: Scalars["String"]["output"];
    id?: Scalars["String"]["output"];
    result?: Scalars["String"]["output"];
}

export interface Folder {
    __typename?: "Folder";
    name?: Scalars["String"]["output"];
    path?: Scalars["String"]["output"];
}

export interface PreconditionResults<JiraDataType> {
    __typename?: "PreconditionResults";
    limit?: Scalars["Int"]["output"];
    results?: Precondition<JiraDataType>[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface TestSetResults<JiraDataType> {
    __typename?: "TestSetResults";
    limit?: Scalars["Int"]["output"];
    results?: TestSet<JiraDataType>[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface TestPlanResults<JiraDataType> {
    __typename?: "TestPlanResults";
    limit?: Scalars["Int"]["output"];
    results?: TestPlan<JiraDataType>[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface TestExecutionResults<JiraDataType> {
    __typename?: "TestExecutionResults";
    limit?: Scalars["Int"]["output"];
    results?: TestExecution<JiraDataType>[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface TestRunResults<JiraDataType> {
    __typename?: "TestRunResults";
    limit?: Scalars["Int"]["output"];
    results?: TestRun<JiraDataType>[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface TestStatusType {
    __typename?: "TestStatusType";
    color?: Scalars["String"]["output"];
    description?: Scalars["String"]["output"];
    final?: Scalars["Boolean"]["output"];
    name?: Scalars["String"]["output"];
}

export interface Attachment {
    __typename?: "Attachment";
    downloadLink?: Scalars["String"]["output"];
    filename?: Scalars["String"]["output"];
    id?: Scalars["String"]["output"];
    storedInJira?: Scalars["Boolean"]["output"];
}

export interface CustomStepField {
    __typename?: "CustomStepField";
    id?: Scalars["String"]["output"];
    name?: Scalars["String"]["output"];
    value?: Scalars["JSON"]["output"];
}

export interface Precondition<JiraDataType> {
    __typename?: "Precondition";
    definition?: Scalars["String"]["output"];
    folder?: Folder;
    issueId?: Scalars["String"]["output"];
    jira?: JiraDataType;
    lastModified?: Scalars["String"]["output"];
    preconditionType?: TestType;
    projectId?: Scalars["String"]["output"];
    tests?: TestResults<JiraDataType>;
}

export interface PreconditionTestsArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface PreconditionJiraArgs {
    fields?: Scalars["String"]["input"][];
}

export interface TestSet<JiraDataType> {
    __typename?: "TestSet";
    issueId?: Scalars["String"]["output"];
    jira?: JiraDataType;
    lastModified?: Scalars["String"]["output"];
    projectId?: Scalars["String"]["output"];
    tests?: TestResults<JiraDataType>;
}

export interface TestSetTestsArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestSetJiraArgs {
    fields?: Scalars["String"]["input"][];
}

export interface TestPlan<JiraDataType> {
    __typename?: "TestPlan";
    folders?: FolderResults;
    issueId?: Scalars["String"]["output"];
    jira?: JiraDataType;
    lastModified?: Scalars["String"]["output"];
    projectId?: Scalars["String"]["output"];
    testExecutions?: TestExecutionResults<JiraDataType>;
    tests?: TestResults<JiraDataType>;
}

export interface TestPlanTestsArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestPlanTestExecutionsArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestPlanJiraArgs {
    fields?: Scalars["String"]["input"][];
}

export interface TestExecution<JiraDataType> {
    __typename?: "TestExecution";
    issueId?: Scalars["String"]["output"];
    jira?: JiraDataType;
    lastModified?: Scalars["String"]["output"];
    projectId?: Scalars["String"]["output"];
    testEnvironments?: Scalars["String"]["output"][];
    testPlans?: TestPlanResults<JiraDataType>;
    testRuns?: TestRunResults<JiraDataType>;
    tests?: TestResults<JiraDataType>;
}

export interface TestExecutionTestsArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestExecutionTestPlansArgs {
    issueIds?: Scalars["String"]["input"][];
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestExecutionTestRunsArgs {
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestExecutionJiraArgs {
    fields?: Scalars["String"]["input"][];
}

export interface TestRun<JiraDataType> {
    __typename?: "TestRun";
    assigneeId?: Scalars["String"]["output"];
    comment?: Scalars["String"]["output"];
    customFields?: TestRunCustomFieldValue[];
    defects?: Scalars["String"]["output"][];
    evidence?: Evidence[];
    examples?: Example[];
    executedById?: Scalars["String"]["output"];
    finishedOn?: Scalars["String"]["output"];
    gherkin?: Scalars["String"]["output"];
    id?: Scalars["String"]["output"];
    iterations?: TestRunIterationResults;
    lastModified?: Scalars["String"]["output"];
    parameters?: TestRunParameter[];
    preconditions?: TestRunPreconditionResults<JiraDataType>;
    results?: Result[];
    scenarioType?: Scalars["String"]["output"];
    startedOn?: Scalars["String"]["output"];
    status?: Status;
    steps?: TestRunStep[];
    test?: Test<JiraDataType>;
    testExecution?: TestExecution<JiraDataType>;
    testType?: TestType;
    unstructured?: Scalars["String"]["output"];
}

export interface TestRunPreconditionsArgs {
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestRunIterationsArgs {
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface TestResults<JiraDataType> {
    __typename?: "TestResults";
    limit?: Scalars["Int"]["output"];
    results?: Test<JiraDataType>[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface FolderResults {
    __typename?: "FolderResults";
    folders?: Scalars["JSON"]["output"];
    issuesCount?: Scalars["Int"]["output"];
    name?: Scalars["String"]["output"];
    path?: Scalars["String"]["output"];
    preconditionsCount?: Scalars["Int"]["output"];
    testsCount?: Scalars["Int"]["output"];
}

export interface Status {
    __typename?: "Status";
    color?: Scalars["String"]["output"];
    coverageStatus?: Scalars["String"]["output"];
    description?: Scalars["String"]["output"];
    final?: Scalars["Boolean"]["output"];
    name?: Scalars["String"]["output"];
}

export interface Evidence {
    __typename?: "Evidence";
    createdOn?: Scalars["String"]["output"];
    downloadLink?: Scalars["String"]["output"];
    filename?: Scalars["String"]["output"];
    id?: Scalars["String"]["output"];
    size?: Scalars["Int"]["output"];
    storedInJira?: Scalars["Boolean"]["output"];
}

export interface TestRunStep {
    __typename?: "TestRunStep";
    action?: Scalars["String"]["output"];
    actualResult?: Scalars["String"]["output"];
    attachments?: Attachment[];
    comment?: Scalars["String"]["output"];
    customFields?: TestRunCustomStepField[];
    data?: Scalars["String"]["output"];
    defects?: Scalars["String"]["output"][];
    evidence?: Evidence[];
    id?: Scalars["String"]["output"];
    result?: Scalars["String"]["output"];
    status?: StepStatus;
}

export interface Example {
    __typename?: "Example";
    duration?: Scalars["Float"]["output"];
    id?: Scalars["String"]["output"];
    status?: StepStatus;
}

export interface Result {
    __typename?: "Result";
    backgrounds?: ResultsStep[];
    duration?: Scalars["Float"]["output"];
    examples?: ResultsExample[];
    hooks?: ResultsStep[];
    log?: Scalars["String"]["output"];
    name?: Scalars["String"]["output"];
    status?: StepStatus;
    steps?: ResultsStep[];
    wasImported?: Scalars["String"]["output"];
}

export interface TestRunPreconditionResults<JiraDataType> {
    __typename?: "TestRunPreconditionResults";
    limit?: Scalars["Int"]["output"];
    results?: TestRunPrecondition<JiraDataType>[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface TestRunCustomFieldValue {
    __typename?: "TestRunCustomFieldValue";
    id?: Scalars["String"]["output"];
    name?: Scalars["String"]["output"];
    values?: Scalars["JSON"]["output"];
}

export interface TestRunParameter {
    __typename?: "TestRunParameter";
    name?: Scalars["String"]["output"];
    value?: Scalars["String"]["output"];
}

export interface TestRunIterationResults {
    __typename?: "TestRunIterationResults";
    limit?: Scalars["Int"]["output"];
    results?: TestRunIteration[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface StepStatus {
    __typename?: "StepStatus";
    color?: Scalars["String"]["output"];
    description?: Scalars["String"]["output"];
    name?: Scalars["String"]["output"];
    testStatus?: Status;
}

export interface TestRunCustomStepField {
    __typename?: "TestRunCustomStepField";
    id?: Scalars["String"]["output"];
    name?: Scalars["String"]["output"];
    value?: Scalars["JSON"]["output"];
}

export interface ResultsExample {
    __typename?: "ResultsExample";
    backgrounds?: ResultsStep[];
    duration?: Scalars["Float"]["output"];
    hooks?: ResultsStep[];
    status?: StepStatus;
    steps?: ResultsStep[];
    wasImported?: Scalars["String"]["output"];
}

export interface ResultsStep {
    __typename?: "ResultsStep";
    duration?: Scalars["Float"]["output"];
    embeddings?: ResultsEmbedding[];
    error?: Scalars["String"]["output"];
    keyword?: Scalars["String"]["output"];
    log?: Scalars["String"]["output"];
    name?: Scalars["String"]["output"];
    status?: StepStatus;
}

export interface TestRunPrecondition<JiraDataType> {
    __typename?: "TestRunPrecondition";
    definition?: Scalars["String"]["output"];
    preconditionRef?: Precondition<JiraDataType>;
}

export interface TestRunIteration {
    __typename?: "TestRunIteration";
    parameters?: TestRunParameter[];
    rank?: Scalars["String"]["output"];
    status?: StepStatus;
    stepResults?: TestRunIterationStepResults;
}

export interface TestRunIterationStepResultsArgs {
    limit: Scalars["Int"]["input"];
    start?: Scalars["Int"]["input"];
}

export interface ResultsEmbedding {
    __typename?: "ResultsEmbedding";
    data?: Scalars["String"]["output"];
    downloadLink?: Scalars["String"]["output"];
    filename?: Scalars["String"]["output"];
    mimeType?: Scalars["String"]["output"];
}

export interface TestRunIterationStepResults {
    __typename?: "TestRunIterationStepResults";
    limit?: Scalars["Int"]["output"];
    results?: TestRunIterationStepResult[];
    start?: Scalars["Int"]["output"];
    total?: Scalars["Int"]["output"];
}

export interface TestRunIterationStepResult {
    __typename?: "TestRunIterationStepResult";
    actualResult?: Scalars["String"]["output"];
    comment?: Scalars["String"]["output"];
    defects?: Scalars["String"]["output"][];
    evidence?: Evidence[];
    id?: Scalars["String"]["output"];
    status?: StepStatus;
}
