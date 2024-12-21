import type {
    CypressFailedRunResult as CypressFailedRunResult_V_12,
    CypressRunResult as CypressRunResult_V_12,
} from "./12.0.0/api";

export type CypressRunResultType = CypressCommandLine.CypressRunResult | CypressRunResult_V_12;
export type CypressFailedRunResultType =
    | CypressCommandLine.CypressFailedRunResult
    | CypressFailedRunResult_V_12;
