import {
    CypressFailedRunResult as CypressFailedRunResult_V_12,
    CypressRunResult as CypressRunResult_V_12,
    RunResult as RunResult_V_12,
} from "./12.0.0/api";
import { PluginConfigOptions as PluginConfigOptions_V_12 } from "./12.0.0/cypress";

export type RunResultType = CypressCommandLine.RunResult | RunResult_V_12;
export type CypressRunResultType = CypressCommandLine.CypressRunResult | CypressRunResult_V_12;
export type CypressFailedRunResultType =
    | CypressCommandLine.CypressFailedRunResult
    | CypressFailedRunResult_V_12;
export type PluginConfigOptions = Cypress.PluginConfigOptions | PluginConfigOptions_V_12;
