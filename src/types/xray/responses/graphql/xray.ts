/* eslint-disable @typescript-eslint/naming-convention */
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
export interface Scalars {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
    JSON: { input: unknown; output: unknown };
}

export interface Test<JiraDataType> {
    __typename?: "Test";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    testType?: Maybe<TestType>;
    steps?: Maybe<Maybe<Step>[]>;
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
}

export interface TestPreconditionsArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestTestSetsArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestTestPlansArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestTestExecutionsArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestTestRunsArgs {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestJiraArgs {
    fields?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
}

export interface TestStatusArgs {
    environment?: InputMaybe<Scalars["String"]["input"]>;
    isFinal?: InputMaybe<Scalars["Boolean"]["input"]>;
    version?: InputMaybe<Scalars["String"]["input"]>;
    testPlan?: InputMaybe<Scalars["String"]["input"]>;
}

export interface TestType {
    __typename?: "TestType";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    kind?: Maybe<Scalars["String"]["output"]>;
}

export interface Step {
    __typename?: "Step";
    id?: Maybe<Scalars["String"]["output"]>;
    action?: Maybe<Scalars["String"]["output"]>;
    data?: Maybe<Scalars["String"]["output"]>;
    result?: Maybe<Scalars["String"]["output"]>;
    attachments?: Maybe<Maybe<Attachment>[]>;
    customFields?: Maybe<Maybe<CustomStepField>[]>;
    callTestIssueId?: Maybe<Scalars["String"]["output"]>;
}

export interface Folder {
    __typename?: "Folder";
    name?: Maybe<Scalars["String"]["output"]>;
    path?: Maybe<Scalars["String"]["output"]>;
}

export interface PreconditionResults<JiraDataType> {
    __typename?: "PreconditionResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<Precondition<JiraDataType>>[]>;
}

export interface TestSetResults<JiraDataType> {
    __typename?: "TestSetResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestSet<JiraDataType>>[]>;
}

export interface TestPlanResults<JiraDataType> {
    __typename?: "TestPlanResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestPlan<JiraDataType>>[]>;
}

export interface TestExecutionResults<JiraDataType> {
    __typename?: "TestExecutionResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestExecution<JiraDataType>>[]>;
}

export interface TestRunResults<JiraDataType> {
    __typename?: "TestRunResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestRun<JiraDataType>>[]>;
}

export interface TestStatusType {
    __typename?: "TestStatusType";
    name?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    final?: Maybe<Scalars["Boolean"]["output"]>;
    color?: Maybe<Scalars["String"]["output"]>;
}

export interface Attachment {
    __typename?: "Attachment";
    id?: Maybe<Scalars["String"]["output"]>;
    filename?: Maybe<Scalars["String"]["output"]>;
    storedInJira?: Maybe<Scalars["Boolean"]["output"]>;
    downloadLink?: Maybe<Scalars["String"]["output"]>;
}

export interface CustomStepField {
    __typename?: "CustomStepField";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    value?: Maybe<Scalars["JSON"]["output"]>;
}

export interface Precondition<JiraDataType> {
    __typename?: "Precondition";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    preconditionType?: Maybe<TestType>;
    definition?: Maybe<Scalars["String"]["output"]>;
    tests?: Maybe<TestResults<JiraDataType>>;
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    folder?: Maybe<Folder>;
}

export interface PreconditionTestsArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface PreconditionJiraArgs {
    fields?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
}

export interface TestSet<JiraDataType> {
    __typename?: "TestSet";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    tests?: Maybe<TestResults<JiraDataType>>;
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
}

export interface TestSetTestsArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestSetJiraArgs {
    fields?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
}

export interface TestPlan<JiraDataType> {
    __typename?: "TestPlan";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    tests?: Maybe<TestResults<JiraDataType>>;
    testExecutions?: Maybe<TestExecutionResults<JiraDataType>>;
    jira?: Maybe<JiraDataType>;
    folders?: Maybe<FolderResults>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
}

export interface TestPlanTestsArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestPlanTestExecutionsArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestPlanJiraArgs {
    fields?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
}

export interface TestExecution<JiraDataType> {
    __typename?: "TestExecution";
    issueId?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    testEnvironments?: Maybe<Maybe<Scalars["String"]["output"]>[]>;
    tests?: Maybe<TestResults<JiraDataType>>;
    testPlans?: Maybe<TestPlanResults<JiraDataType>>;
    testRuns?: Maybe<TestRunResults<JiraDataType>>;
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
}

export interface TestExecutionTestsArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestExecutionTestPlansArgs {
    issueIds?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestExecutionTestRunsArgs {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestExecutionJiraArgs {
    fields?: InputMaybe<InputMaybe<Scalars["String"]["input"]>[]>;
}

export interface TestRun<JiraDataType> {
    __typename?: "TestRun";
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<Status>;
    unstructured?: Maybe<Scalars["String"]["output"]>;
    gherkin?: Maybe<Scalars["String"]["output"]>;
    scenarioType?: Maybe<Scalars["String"]["output"]>;
    comment?: Maybe<Scalars["String"]["output"]>;
    startedOn?: Maybe<Scalars["String"]["output"]>;
    evidence?: Maybe<Maybe<Evidence>[]>;
    defects?: Maybe<Maybe<Scalars["String"]["output"]>[]>;
    steps?: Maybe<Maybe<TestRunStep>[]>;
    examples?: Maybe<Maybe<Example>[]>;
    results?: Maybe<Maybe<Result>[]>;
    testType?: Maybe<TestType>;
    executedById?: Maybe<Scalars["String"]["output"]>;
    assigneeId?: Maybe<Scalars["String"]["output"]>;
    finishedOn?: Maybe<Scalars["String"]["output"]>;
    preconditions?: Maybe<TestRunPreconditionResults<JiraDataType>>;
    test?: Maybe<Test<JiraDataType>>;
    testExecution?: Maybe<TestExecution<JiraDataType>>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    customFields?: Maybe<Maybe<TestRunCustomFieldValue>[]>;
    parameters?: Maybe<Maybe<TestRunParameter>[]>;
    iterations?: Maybe<TestRunIterationResults>;
}

export interface TestRunPreconditionsArgs {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestRunIterationsArgs {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface TestResults<JiraDataType> {
    __typename?: "TestResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<Test<JiraDataType>>[]>;
}

export interface FolderResults {
    __typename?: "FolderResults";
    name?: Maybe<Scalars["String"]["output"]>;
    path?: Maybe<Scalars["String"]["output"]>;
    issuesCount?: Maybe<Scalars["Int"]["output"]>;
    testsCount?: Maybe<Scalars["Int"]["output"]>;
    preconditionsCount?: Maybe<Scalars["Int"]["output"]>;
    folders?: Maybe<Scalars["JSON"]["output"]>;
}

export interface Status {
    __typename?: "Status";
    name?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    final?: Maybe<Scalars["Boolean"]["output"]>;
    color?: Maybe<Scalars["String"]["output"]>;
    coverageStatus?: Maybe<Scalars["String"]["output"]>;
}

export interface Evidence {
    __typename?: "Evidence";
    id?: Maybe<Scalars["String"]["output"]>;
    filename?: Maybe<Scalars["String"]["output"]>;
    storedInJira?: Maybe<Scalars["Boolean"]["output"]>;
    downloadLink?: Maybe<Scalars["String"]["output"]>;
    size?: Maybe<Scalars["Int"]["output"]>;
    createdOn?: Maybe<Scalars["String"]["output"]>;
}

export interface TestRunStep {
    __typename?: "TestRunStep";
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    action?: Maybe<Scalars["String"]["output"]>;
    data?: Maybe<Scalars["String"]["output"]>;
    result?: Maybe<Scalars["String"]["output"]>;
    customFields?: Maybe<Maybe<TestRunCustomStepField>[]>;
    comment?: Maybe<Scalars["String"]["output"]>;
    evidence?: Maybe<Maybe<Evidence>[]>;
    attachments?: Maybe<Maybe<Attachment>[]>;
    defects?: Maybe<Maybe<Scalars["String"]["output"]>[]>;
    actualResult?: Maybe<Scalars["String"]["output"]>;
}

export interface Example {
    __typename?: "Example";
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    duration?: Maybe<Scalars["Float"]["output"]>;
}

export interface Result {
    __typename?: "Result";
    log?: Maybe<Scalars["String"]["output"]>;
    examples?: Maybe<Maybe<ResultsExample>[]>;
    wasImported?: Maybe<Scalars["String"]["output"]>;
    duration?: Maybe<Scalars["Float"]["output"]>;
    status?: Maybe<StepStatus>;
    name?: Maybe<Scalars["String"]["output"]>;
    hooks?: Maybe<Maybe<ResultsStep>[]>;
    backgrounds?: Maybe<Maybe<ResultsStep>[]>;
    steps?: Maybe<Maybe<ResultsStep>[]>;
}

export interface TestRunPreconditionResults<JiraDataType> {
    __typename?: "TestRunPreconditionResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestRunPrecondition<JiraDataType>>[]>;
}

export interface TestRunCustomFieldValue {
    __typename?: "TestRunCustomFieldValue";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    values?: Maybe<Scalars["JSON"]["output"]>;
}

export interface TestRunParameter {
    __typename?: "TestRunParameter";
    name?: Maybe<Scalars["String"]["output"]>;
    value?: Maybe<Scalars["String"]["output"]>;
}

export interface TestRunIterationResults {
    __typename?: "TestRunIterationResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestRunIteration>[]>;
}

export interface StepStatus {
    __typename?: "StepStatus";
    name?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    color?: Maybe<Scalars["String"]["output"]>;
    testStatus?: Maybe<Status>;
}

export interface TestRunCustomStepField {
    __typename?: "TestRunCustomStepField";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    value?: Maybe<Scalars["JSON"]["output"]>;
}

export interface ResultsExample {
    __typename?: "ResultsExample";
    wasImported?: Maybe<Scalars["String"]["output"]>;
    duration?: Maybe<Scalars["Float"]["output"]>;
    status?: Maybe<StepStatus>;
    hooks?: Maybe<Maybe<ResultsStep>[]>;
    backgrounds?: Maybe<Maybe<ResultsStep>[]>;
    steps?: Maybe<Maybe<ResultsStep>[]>;
}

export interface ResultsStep {
    __typename?: "ResultsStep";
    keyword?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    embeddings?: Maybe<Maybe<ResultsEmbedding>[]>;
    duration?: Maybe<Scalars["Float"]["output"]>;
    error?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    log?: Maybe<Scalars["String"]["output"]>;
}

export interface TestRunPrecondition<JiraDataType> {
    __typename?: "TestRunPrecondition";
    preconditionRef?: Maybe<Precondition<JiraDataType>>;
    definition?: Maybe<Scalars["String"]["output"]>;
}

export interface TestRunIteration {
    __typename?: "TestRunIteration";
    rank?: Maybe<Scalars["String"]["output"]>;
    parameters?: Maybe<Maybe<TestRunParameter>[]>;
    status?: Maybe<StepStatus>;
    stepResults?: Maybe<TestRunIterationStepResults>;
}

export interface TestRunIterationStepResultsArgs {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface ResultsEmbedding {
    __typename?: "ResultsEmbedding";
    filename?: Maybe<Scalars["String"]["output"]>;
    mimeType?: Maybe<Scalars["String"]["output"]>;
    data?: Maybe<Scalars["String"]["output"]>;
    downloadLink?: Maybe<Scalars["String"]["output"]>;
}

export interface TestRunIterationStepResults {
    __typename?: "TestRunIterationStepResults";
    total?: Maybe<Scalars["Int"]["output"]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestRunIterationStepResult>[]>;
}

export interface TestRunIterationStepResult {
    __typename?: "TestRunIterationStepResult";
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    comment?: Maybe<Scalars["String"]["output"]>;
    evidence?: Maybe<Maybe<Evidence>[]>;
    defects?: Maybe<Maybe<Scalars["String"]["output"]>[]>;
    actualResult?: Maybe<Scalars["String"]["output"]>;
}
