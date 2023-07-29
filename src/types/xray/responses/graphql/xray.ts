import { StringMap } from "../../../util";

/*
 * Generated using: https://transform.tools/graphql-to-typescript
 * Some type parameters have been added manually.
 */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends StringMap<unknown>> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends StringMap<unknown>, K extends keyof T> = {
    [_ in K]?: never;
};
export type Incremental<T> =
    | T
    | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
    JSON: { input: unknown; output: unknown };
};

export type Test<JiraDataType> = {
    __typename?: "Test";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    testType?: Maybe<TestType>;
    steps?: Maybe<Array<Maybe<Step>>>;
    unstructured?: Maybe<Scalars["String"]["output"]>;
    gherkin?: Maybe<Scalars["String"]["output"]>;
    folder?: Maybe<Folder>;
    scenarioType?: Maybe<Scalars["String"]["output"]>;
    preconditions?: Maybe<PreconditionResults<JiraDataType>>;
    testSets?: Maybe<TestSetResults<JiraDataType>>;
    testPlans?: Maybe<TestPlanResults<JiraDataType>>;
    testExecutions?: Maybe<TestExecutionResults<JiraDataType>>;
    testRuns?: Maybe<TestRunResults<JiraDataType>>;
    jira: JiraDataType;
    status?: Maybe<TestStatusType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
};

export type TestPreconditionsArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestTestSetsArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestTestPlansArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestTestExecutionsArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestTestRunsArgs = {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestJiraArgs = {
    fields?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
};

export type TestStatusArgs = {
    environment?: InputMaybe<Scalars["String"]["input"]>;
    isFinal?: InputMaybe<Scalars["Boolean"]["input"]>;
    version?: InputMaybe<Scalars["String"]["input"]>;
    testPlan?: InputMaybe<Scalars["String"]["input"]>;
};

export type TestType = {
    __typename?: "TestType";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    kind?: Maybe<Scalars["String"]["output"]>;
};

export type Step = {
    __typename?: "Step";
    id?: Maybe<Scalars["String"]["output"]>;
    action?: Maybe<Scalars["String"]["output"]>;
    data?: Maybe<Scalars["String"]["output"]>;
    result?: Maybe<Scalars["String"]["output"]>;
    attachments?: Maybe<Array<Maybe<Attachment>>>;
    customFields?: Maybe<Array<Maybe<CustomStepField>>>;
    callTestIssueId?: Maybe<Scalars["String"]["output"]>;
};

export type Folder = {
    __typename?: "Folder";
    name?: Maybe<Scalars["String"]["output"]>;
    path?: Maybe<Scalars["String"]["output"]>;
};

export type PreconditionResults<JiraDataType> = {
    __typename?: "PreconditionResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<Precondition<JiraDataType>>>>;
};

export type TestSetResults<JiraDataType> = {
    __typename?: "TestSetResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<TestSet<JiraDataType>>>>;
};

export type TestPlanResults<JiraDataType> = {
    __typename?: "TestPlanResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<TestPlan<JiraDataType>>>>;
};

export type TestExecutionResults<JiraDataType> = {
    __typename?: "TestExecutionResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<TestExecution<JiraDataType>>>>;
};

export type TestRunResults<JiraDataType> = {
    __typename?: "TestRunResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<TestRun<JiraDataType>>>>;
};

export type TestStatusType = {
    __typename?: "TestStatusType";
    name?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    final?: Maybe<Scalars["Boolean"]["output"]>;
    color?: Maybe<Scalars["String"]["output"]>;
};

export type Attachment = {
    __typename?: "Attachment";
    id?: Maybe<Scalars["String"]["output"]>;
    filename?: Maybe<Scalars["String"]["output"]>;
    storedInJira?: Maybe<Scalars["Boolean"]["output"]>;
    downloadLink?: Maybe<Scalars["String"]["output"]>;
};

export type CustomStepField = {
    __typename?: "CustomStepField";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    value?: Maybe<Scalars["JSON"]["output"]>;
};

export type Precondition<JiraDataType> = {
    __typename?: "Precondition";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    preconditionType?: Maybe<TestType>;
    definition?: Maybe<Scalars["String"]["output"]>;
    tests?: Maybe<TestResults<JiraDataType>>;
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    folder?: Maybe<Folder>;
};

export type PreconditionTestsArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type PreconditionJiraArgs = {
    fields?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
};

export type TestSet<JiraDataType> = {
    __typename?: "TestSet";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    tests?: Maybe<TestResults<JiraDataType>>;
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
};

export type TestSetTestsArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestSetJiraArgs = {
    fields?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
};

export type TestPlan<JiraDataType> = {
    __typename?: "TestPlan";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    tests?: Maybe<TestResults<JiraDataType>>;
    testExecutions?: Maybe<TestExecutionResults<JiraDataType>>;
    jira?: Maybe<JiraDataType>;
    folders?: Maybe<FolderResults>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
};

export type TestPlanTestsArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestPlanTestExecutionsArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestPlanJiraArgs = {
    fields?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
};

export type TestExecution<JiraDataType> = {
    __typename?: "TestExecution";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    testEnvironments?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
    tests?: Maybe<TestResults<JiraDataType>>;
    testPlans?: Maybe<TestPlanResults<JiraDataType>>;
    testRuns?: Maybe<TestRunResults<JiraDataType>>;
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
};

export type TestExecutionTestsArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestExecutionTestPlansArgs = {
    issueIds?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestExecutionTestRunsArgs = {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestExecutionJiraArgs = {
    fields?: InputMaybe<Array<InputMaybe<Scalars["String"]["input"]>>>;
};

export type TestRun<JiraDataType> = {
    __typename?: "TestRun";
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<Status>;
    unstructured?: Maybe<Scalars["String"]["output"]>;
    gherkin?: Maybe<Scalars["String"]["output"]>;
    scenarioType?: Maybe<Scalars["String"]["output"]>;
    comment?: Maybe<Scalars["String"]["output"]>;
    startedOn?: Maybe<Scalars["String"]["output"]>;
    evidence?: Maybe<Array<Maybe<Evidence>>>;
    defects?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
    steps?: Maybe<Array<Maybe<TestRunStep>>>;
    examples?: Maybe<Array<Maybe<Example>>>;
    results?: Maybe<Array<Maybe<Result>>>;
    testType?: Maybe<TestType>;
    executedById?: Maybe<Scalars["String"]["output"]>;
    assigneeId?: Maybe<Scalars["String"]["output"]>;
    finishedOn?: Maybe<Scalars["String"]["output"]>;
    preconditions?: Maybe<TestRunPreconditionResults<JiraDataType>>;
    test?: Maybe<Test<JiraDataType>>;
    testExecution?: Maybe<TestExecution<JiraDataType>>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    customFields?: Maybe<Array<Maybe<TestRunCustomFieldValue>>>;
    parameters?: Maybe<Array<Maybe<TestRunParameter>>>;
    iterations?: Maybe<TestRunIterationResults>;
};

export type TestRunPreconditionsArgs = {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestRunIterationsArgs = {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type TestResults<JiraDataType> = {
    __typename?: "TestResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<Test<JiraDataType>>>>;
};

export type FolderResults = {
    __typename?: "FolderResults";
    name?: Maybe<Scalars["String"]["output"]>;
    path?: Maybe<Scalars["String"]["output"]>;
    issuesCount?: Maybe<Scalars["Int"]["output"]>;
    testsCount?: Maybe<Scalars["Int"]["output"]>;
    preconditionsCount?: Maybe<Scalars["Int"]["output"]>;
    folders?: Maybe<Scalars["JSON"]["output"]>;
};

export type Status = {
    __typename?: "Status";
    name?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    final?: Maybe<Scalars["Boolean"]["output"]>;
    color?: Maybe<Scalars["String"]["output"]>;
    coverageStatus?: Maybe<Scalars["String"]["output"]>;
};

export type Evidence = {
    __typename?: "Evidence";
    id?: Maybe<Scalars["String"]["output"]>;
    filename?: Maybe<Scalars["String"]["output"]>;
    storedInJira?: Maybe<Scalars["Boolean"]["output"]>;
    downloadLink?: Maybe<Scalars["String"]["output"]>;
    size?: Maybe<Scalars["Int"]["output"]>;
    createdOn?: Maybe<Scalars["String"]["output"]>;
};

export type TestRunStep = {
    __typename?: "TestRunStep";
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    action?: Maybe<Scalars["String"]["output"]>;
    data?: Maybe<Scalars["String"]["output"]>;
    result?: Maybe<Scalars["String"]["output"]>;
    customFields?: Maybe<Array<Maybe<TestRunCustomStepField>>>;
    comment?: Maybe<Scalars["String"]["output"]>;
    evidence?: Maybe<Array<Maybe<Evidence>>>;
    attachments?: Maybe<Array<Maybe<Attachment>>>;
    defects?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
    actualResult?: Maybe<Scalars["String"]["output"]>;
};

export type Example = {
    __typename?: "Example";
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    duration?: Maybe<Scalars["Float"]["output"]>;
};

export type Result = {
    __typename?: "Result";
    log?: Maybe<Scalars["String"]["output"]>;
    examples?: Maybe<Array<Maybe<ResultsExample>>>;
    wasImported?: Maybe<Scalars["String"]["output"]>;
    duration?: Maybe<Scalars["Float"]["output"]>;
    status?: Maybe<StepStatus>;
    name?: Maybe<Scalars["String"]["output"]>;
    hooks?: Maybe<Array<Maybe<ResultsStep>>>;
    backgrounds?: Maybe<Array<Maybe<ResultsStep>>>;
    steps?: Maybe<Array<Maybe<ResultsStep>>>;
};

export type TestRunPreconditionResults<JiraDataType> = {
    __typename?: "TestRunPreconditionResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<TestRunPrecondition<JiraDataType>>>>;
};

export type TestRunCustomFieldValue = {
    __typename?: "TestRunCustomFieldValue";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    values?: Maybe<Scalars["JSON"]["output"]>;
};

export type TestRunParameter = {
    __typename?: "TestRunParameter";
    name?: Maybe<Scalars["String"]["output"]>;
    value?: Maybe<Scalars["String"]["output"]>;
};

export type TestRunIterationResults = {
    __typename?: "TestRunIterationResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<TestRunIteration>>>;
};

export type StepStatus = {
    __typename?: "StepStatus";
    name?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    color?: Maybe<Scalars["String"]["output"]>;
    testStatus?: Maybe<Status>;
};

export type TestRunCustomStepField = {
    __typename?: "TestRunCustomStepField";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    value?: Maybe<Scalars["JSON"]["output"]>;
};

export type ResultsExample = {
    __typename?: "ResultsExample";
    wasImported?: Maybe<Scalars["String"]["output"]>;
    duration?: Maybe<Scalars["Float"]["output"]>;
    status?: Maybe<StepStatus>;
    hooks?: Maybe<Array<Maybe<ResultsStep>>>;
    backgrounds?: Maybe<Array<Maybe<ResultsStep>>>;
    steps?: Maybe<Array<Maybe<ResultsStep>>>;
};

export type ResultsStep = {
    __typename?: "ResultsStep";
    keyword?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    embeddings?: Maybe<Array<Maybe<ResultsEmbedding>>>;
    duration?: Maybe<Scalars["Float"]["output"]>;
    error?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    log?: Maybe<Scalars["String"]["output"]>;
};

export type TestRunPrecondition<JiraDataType> = {
    __typename?: "TestRunPrecondition";
    preconditionRef?: Maybe<Precondition<JiraDataType>>;
    definition?: Maybe<Scalars["String"]["output"]>;
};

export type TestRunIteration = {
    __typename?: "TestRunIteration";
    rank?: Maybe<Scalars["String"]["output"]>;
    parameters?: Maybe<Array<Maybe<TestRunParameter>>>;
    status?: Maybe<StepStatus>;
    stepResults?: Maybe<TestRunIterationStepResults>;
};

export type TestRunIterationStepResultsArgs = {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ResultsEmbedding = {
    __typename?: "ResultsEmbedding";
    filename?: Maybe<Scalars["String"]["output"]>;
    mimeType?: Maybe<Scalars["String"]["output"]>;
    data?: Maybe<Scalars["String"]["output"]>;
    downloadLink?: Maybe<Scalars["String"]["output"]>;
};

export type TestRunIterationStepResults = {
    __typename?: "TestRunIterationStepResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Array<Maybe<TestRunIterationStepResult>>>;
};

export type TestRunIterationStepResult = {
    __typename?: "TestRunIterationStepResult";
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    comment?: Maybe<Scalars["String"]["output"]>;
    evidence?: Maybe<Array<Maybe<Evidence>>>;
    defects?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
    actualResult?: Maybe<Scalars["String"]["output"]>;
};
