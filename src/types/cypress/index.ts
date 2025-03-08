import type * as CypressCommandLineV12 from "./cypress-v12";
import type * as CypressCommandLineV13 from "./cypress-v13";

type Version = "<13" | "13" | "14";

export type RunResult<T extends Version = Version> = {
    ["<13"]: CypressCommandLineV12.RunResult;
    ["13"]: CypressCommandLineV13.RunResult;
    ["14"]: CypressCommandLine.RunResult;
}[T];

export type CypressRunResult<T extends Version = Version> = {
    ["<13"]: CypressCommandLineV12.CypressRunResult;
    ["13"]: CypressCommandLineV13.CypressRunResult;
    ["14"]: CypressCommandLine.CypressRunResult;
}[T];

export type CypressFailedRunResult<T extends Version = Version> = {
    ["<13"]: CypressCommandLineV12.CypressFailedRunResult;
    ["13"]: CypressCommandLineV13.CypressFailedRunResult;
    ["14"]: CypressCommandLine.CypressFailedRunResult;
}[T];
