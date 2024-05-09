import {
    CypressRunResult as CypressRunResult_V_12,
    RunResult as RunResult_V_12,
} from "./12.0.0/api";

export type RunResultType = RunResult_V_12 | CypressCommandLine.RunResult;
export type CypressRunResultType = CypressRunResult_V_12 | CypressCommandLine.CypressRunResult;
