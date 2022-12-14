// Taken from:
// https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results

// small utility types to better express meaning of other types
export type dateTimeISO = string;

export type XrayCustomField = (
    | { [k: string]: unknown }
    | { [k: string]: unknown }
)[];

export interface XrayExecutionResults {
    testExecutionKey?: string;
    info?: XrayTestExecutionInfo;
    tests?: [XrayTest, ...XrayTest[]];
}

export interface XrayTestExecutionInfo {
    project?: string;
    summary?: string;
    description?: string;
    version?: string;
    revision?: string;
    user?: string;
    startDate?: dateTimeISO;
    finishDate?: dateTimeISO;
    testPlanKey?: string;
    testEnvironments?: string[];
}

export interface XrayTest {
    testKey?: string;
    testInfo?: XrayTestInfo;
    start?: dateTimeISO;
    finish?: dateTimeISO;
    comment?: string;
    executedBy?: string;
    assignee?: string;
    status: string;
    steps?: XrayManualTestStepResult[];
    examples?: ("TODO" | "FAILED" | "PASSED" | "EXECUTING")[];
    results?: XrayIterationResult[];
    iterations?: XrayIterationResult[];
    defects?: string[];
    evidence?: XrayEvidenceItem[];
    /**
     * Deprecated.
     */
    evidences?: XrayEvidenceItem[];
    customFields?: XrayCustomField;
}

export interface XrayTestInfo {
    summary: string;
    projectKey: string;
    requirementKeys?: string[];
    labels?: string[];
    type: string;
    steps?: {
        action: string;
        data?: string;
        result?: string;
    }[];
    scenario?: string;
    definition?: string;
}

export interface XrayManualTestStepResult {
    status: string;
    comment?: string;
    evidence?: XrayEvidenceItem[];
    defects?: string[];
    actualResult?: string;
}

export interface XrayBDDTest {}

export interface XrayIterationResult {
    name?: string;
    parameters?: {
        name: string;
        value?: string;
    }[];
    log?: string;
    duration?: string;
    status: string;
    steps?: XrayManualTestStepResult[];
}

export interface XrayEvidenceItem {
    data: string;
    filename: string;
    contentType?: string;
}
