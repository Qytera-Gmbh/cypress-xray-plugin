import { CypressFailedRunResult_V12, CypressRunResult_V12 } from "./12.0.0/api";
import { CypressFailedRunResult_V13, CypressRunResult_V13 } from "./13.0.0/api";

export type CypressRunResultType = CypressRunResult_V12 | CypressRunResult_V13;
export type CypressFailedRunResultType = CypressFailedRunResult_V12 | CypressFailedRunResult_V13;
