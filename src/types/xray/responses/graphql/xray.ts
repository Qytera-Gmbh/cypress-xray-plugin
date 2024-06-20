/* eslint-disable @typescript-eslint/naming-convention */
import { StringMap } from "../../../util";

/*
 * Generated using: https://transform.tools/graphql-to-typescript
 * Some type parameters have been added manually.
 */
export type Maybe<T> = null | T;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends StringMap<unknown>> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends StringMap<unknown>, K extends keyof T> = {
    [_ in K]?: never;
};
export type Incremental<T> =
    | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never }
    | T;
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
    folder?: Maybe<Folder>;
    gherkin?: Maybe<Scalars["String"]["output"]>;
    issueId?: Maybe<Scalars["String"]["output"]>;
    jira: JiraDataType;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    preconditions?: Maybe<PreconditionResults<JiraDataType>>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    scenarioType?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<TestStatusType>;
    steps?: Maybe<Maybe<Step>[]>;
    testExecutions?: Maybe<TestExecutionResults<JiraDataType>>;
    testPlans?: Maybe<TestPlanResults<JiraDataType>>;
    testRuns?: Maybe<TestRunResults<JiraDataType>>;
    testSets?: Maybe<TestSetResults<JiraDataType>>;
    testType?: Maybe<TestType>;
    unstructured?: Maybe<Scalars["String"]["output"]>;
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
    testPlan?: InputMaybe<Scalars["String"]["input"]>;
    version?: InputMaybe<Scalars["String"]["input"]>;
}

export interface TestType {
    __typename?: "TestType";
    id?: Maybe<Scalars["String"]["output"]>;
    kind?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
}

export interface Step {
    __typename?: "Step";
    action?: Maybe<Scalars["String"]["output"]>;
    attachments?: Maybe<Maybe<Attachment>[]>;
    callTestIssueId?: Maybe<Scalars["String"]["output"]>;
    customFields?: Maybe<Maybe<CustomStepField>[]>;
    data?: Maybe<Scalars["String"]["output"]>;
    id?: Maybe<Scalars["String"]["output"]>;
    result?: Maybe<Scalars["String"]["output"]>;
}

export interface Folder {
    __typename?: "Folder";
    name?: Maybe<Scalars["String"]["output"]>;
    path?: Maybe<Scalars["String"]["output"]>;
}

export interface PreconditionResults<JiraDataType> {
    __typename?: "PreconditionResults";
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<Precondition<JiraDataType>>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
}

export interface TestSetResults<JiraDataType> {
    __typename?: "TestSetResults";
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestSet<JiraDataType>>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
}

export interface TestPlanResults<JiraDataType> {
    __typename?: "TestPlanResults";
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestPlan<JiraDataType>>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
}

export interface TestExecutionResults<JiraDataType> {
    __typename?: "TestExecutionResults";
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestExecution<JiraDataType>>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
}

export interface TestRunResults<JiraDataType> {
    __typename?: "TestRunResults";
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestRun<JiraDataType>>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
}

export interface TestStatusType {
    __typename?: "TestStatusType";
    color?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    final?: Maybe<Scalars["Boolean"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
}

export interface Attachment {
    __typename?: "Attachment";
    downloadLink?: Maybe<Scalars["String"]["output"]>;
    filename?: Maybe<Scalars["String"]["output"]>;
    id?: Maybe<Scalars["String"]["output"]>;
    storedInJira?: Maybe<Scalars["Boolean"]["output"]>;
}

export interface CustomStepField {
    __typename?: "CustomStepField";
    id?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    value?: Maybe<Scalars["JSON"]["output"]>;
}

export interface Precondition<JiraDataType> {
    __typename?: "Precondition";
    definition?: Maybe<Scalars["String"]["output"]>;
    folder?: Maybe<Folder>;
    issueId?: Maybe<Scalars["String"]["output"]>;
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    preconditionType?: Maybe<TestType>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    tests?: Maybe<TestResults<JiraDataType>>;
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
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    tests?: Maybe<TestResults<JiraDataType>>;
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
    folders?: Maybe<FolderResults>;
    issueId?: Maybe<Scalars["String"]["output"]>;
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    testExecutions?: Maybe<TestExecutionResults<JiraDataType>>;
    tests?: Maybe<TestResults<JiraDataType>>;
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
    jira?: Maybe<JiraDataType>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    projectId?: Maybe<Scalars["String"]["output"]>;
    testEnvironments?: Maybe<Maybe<Scalars["String"]["output"]>[]>;
    testPlans?: Maybe<TestPlanResults<JiraDataType>>;
    testRuns?: Maybe<TestRunResults<JiraDataType>>;
    tests?: Maybe<TestResults<JiraDataType>>;
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
    assigneeId?: Maybe<Scalars["String"]["output"]>;
    comment?: Maybe<Scalars["String"]["output"]>;
    customFields?: Maybe<Maybe<TestRunCustomFieldValue>[]>;
    defects?: Maybe<Maybe<Scalars["String"]["output"]>[]>;
    evidence?: Maybe<Maybe<Evidence>[]>;
    examples?: Maybe<Maybe<Example>[]>;
    executedById?: Maybe<Scalars["String"]["output"]>;
    finishedOn?: Maybe<Scalars["String"]["output"]>;
    gherkin?: Maybe<Scalars["String"]["output"]>;
    id?: Maybe<Scalars["String"]["output"]>;
    iterations?: Maybe<TestRunIterationResults>;
    lastModified?: Maybe<Scalars["String"]["output"]>;
    parameters?: Maybe<Maybe<TestRunParameter>[]>;
    preconditions?: Maybe<TestRunPreconditionResults<JiraDataType>>;
    results?: Maybe<Maybe<Result>[]>;
    scenarioType?: Maybe<Scalars["String"]["output"]>;
    startedOn?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<Status>;
    steps?: Maybe<Maybe<TestRunStep>[]>;
    test?: Maybe<Test<JiraDataType>>;
    testExecution?: Maybe<TestExecution<JiraDataType>>;
    testType?: Maybe<TestType>;
    unstructured?: Maybe<Scalars["String"]["output"]>;
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
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<Test<JiraDataType>>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
}

export interface FolderResults {
    __typename?: "FolderResults";
    folders?: Maybe<Scalars["JSON"]["output"]>;
    issuesCount?: Maybe<Scalars["Int"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    path?: Maybe<Scalars["String"]["output"]>;
    preconditionsCount?: Maybe<Scalars["Int"]["output"]>;
    testsCount?: Maybe<Scalars["Int"]["output"]>;
}

export interface Status {
    __typename?: "Status";
    color?: Maybe<Scalars["String"]["output"]>;
    coverageStatus?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    final?: Maybe<Scalars["Boolean"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
}

export interface Evidence {
    __typename?: "Evidence";
    createdOn?: Maybe<Scalars["String"]["output"]>;
    downloadLink?: Maybe<Scalars["String"]["output"]>;
    filename?: Maybe<Scalars["String"]["output"]>;
    id?: Maybe<Scalars["String"]["output"]>;
    size?: Maybe<Scalars["Int"]["output"]>;
    storedInJira?: Maybe<Scalars["Boolean"]["output"]>;
}

export interface TestRunStep {
    __typename?: "TestRunStep";
    action?: Maybe<Scalars["String"]["output"]>;
    actualResult?: Maybe<Scalars["String"]["output"]>;
    attachments?: Maybe<Maybe<Attachment>[]>;
    comment?: Maybe<Scalars["String"]["output"]>;
    customFields?: Maybe<Maybe<TestRunCustomStepField>[]>;
    data?: Maybe<Scalars["String"]["output"]>;
    defects?: Maybe<Maybe<Scalars["String"]["output"]>[]>;
    evidence?: Maybe<Maybe<Evidence>[]>;
    id?: Maybe<Scalars["String"]["output"]>;
    result?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
}

export interface Example {
    __typename?: "Example";
    duration?: Maybe<Scalars["Float"]["output"]>;
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
}

export interface Result {
    __typename?: "Result";
    backgrounds?: Maybe<Maybe<ResultsStep>[]>;
    duration?: Maybe<Scalars["Float"]["output"]>;
    examples?: Maybe<Maybe<ResultsExample>[]>;
    hooks?: Maybe<Maybe<ResultsStep>[]>;
    log?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    steps?: Maybe<Maybe<ResultsStep>[]>;
    wasImported?: Maybe<Scalars["String"]["output"]>;
}

export interface TestRunPreconditionResults<JiraDataType> {
    __typename?: "TestRunPreconditionResults";
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestRunPrecondition<JiraDataType>>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
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
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestRunIteration>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
}

export interface StepStatus {
    __typename?: "StepStatus";
    color?: Maybe<Scalars["String"]["output"]>;
    description?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
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
    backgrounds?: Maybe<Maybe<ResultsStep>[]>;
    duration?: Maybe<Scalars["Float"]["output"]>;
    hooks?: Maybe<Maybe<ResultsStep>[]>;
    status?: Maybe<StepStatus>;
    steps?: Maybe<Maybe<ResultsStep>[]>;
    wasImported?: Maybe<Scalars["String"]["output"]>;
}

export interface ResultsStep {
    __typename?: "ResultsStep";
    duration?: Maybe<Scalars["Float"]["output"]>;
    embeddings?: Maybe<Maybe<ResultsEmbedding>[]>;
    error?: Maybe<Scalars["String"]["output"]>;
    keyword?: Maybe<Scalars["String"]["output"]>;
    log?: Maybe<Scalars["String"]["output"]>;
    name?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
}

export interface TestRunPrecondition<JiraDataType> {
    __typename?: "TestRunPrecondition";
    definition?: Maybe<Scalars["String"]["output"]>;
    preconditionRef?: Maybe<Precondition<JiraDataType>>;
}

export interface TestRunIteration {
    __typename?: "TestRunIteration";
    parameters?: Maybe<Maybe<TestRunParameter>[]>;
    rank?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
    stepResults?: Maybe<TestRunIterationStepResults>;
}

export interface TestRunIterationStepResultsArgs {
    limit: Scalars["Int"]["input"];
    start?: InputMaybe<Scalars["Int"]["input"]>;
}

export interface ResultsEmbedding {
    __typename?: "ResultsEmbedding";
    data?: Maybe<Scalars["String"]["output"]>;
    downloadLink?: Maybe<Scalars["String"]["output"]>;
    filename?: Maybe<Scalars["String"]["output"]>;
    mimeType?: Maybe<Scalars["String"]["output"]>;
}

export interface TestRunIterationStepResults {
    __typename?: "TestRunIterationStepResults";
    limit?: Maybe<Scalars["Int"]["output"]>;
    results?: Maybe<Maybe<TestRunIterationStepResult>[]>;
    start?: Maybe<Scalars["Int"]["output"]>;
    total?: Maybe<Scalars["Int"]["output"]>;
}

export interface TestRunIterationStepResult {
    __typename?: "TestRunIterationStepResult";
    actualResult?: Maybe<Scalars["String"]["output"]>;
    comment?: Maybe<Scalars["String"]["output"]>;
    defects?: Maybe<Maybe<Scalars["String"]["output"]>[]>;
    evidence?: Maybe<Maybe<Evidence>[]>;
    id?: Maybe<Scalars["String"]["output"]>;
    status?: Maybe<StepStatus>;
}
