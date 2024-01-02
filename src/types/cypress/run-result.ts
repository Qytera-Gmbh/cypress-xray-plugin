import {
    CypressFailedRunResult as CypressFailedRunResult_V12,
    CypressRunResult as CypressRunResult_V12,
    TestResult as CypressTestResult_V12,
} from "./12.0.0/api";
import {
    CypressFailedRunResult as CypressFailedRunResult_V13,
    CypressRunResult as CypressRunResult_V13,
    TestResult as CypressTestResult_V13,
} from "./13.0.0/api";

export type CypressRunResultType = CypressRunResult_V12 | CypressRunResult_V13;
export type CypressFailedRunResultType = CypressFailedRunResult_V12 | CypressFailedRunResult_V13;
export type CypressTestResultType = CypressTestResult_V12 | CypressTestResult_V13;

export type CypressResultsType = CypressRunResultType | CypressFailedRunResultType;
