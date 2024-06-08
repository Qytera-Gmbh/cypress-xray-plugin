import {
    CypressRunResult as CypressRunResult_V_12,
    RunResult as RunResult_V_12,
} from "./12.0.0/api";
import { PluginConfigOptions as PluginConfigOptions_V_12 } from "./12.0.0/cypress";

export type RunResultType = RunResult_V_12 | CypressCommandLine.RunResult;
export type CypressRunResultType = CypressRunResult_V_12 | CypressCommandLine.CypressRunResult;
export type PluginConfigOptions = PluginConfigOptions_V_12 | Cypress.PluginConfigOptions;
