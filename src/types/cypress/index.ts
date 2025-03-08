import type * as CypressV12 from "./cypress-v12";
import type * as CypressV13 from "./cypress-v13";

type Version = "<13" | "13" | "14";

export type RunResult<T extends Version = Version> = {
    ["<13"]: CypressV12.RunResult;
    ["13"]: CypressV13.RunResult;
    ["14"]: CypressCommandLine.RunResult;
}[T];

export type CypressRunResult<T extends Version = Version> = {
    ["<13"]: CypressV12.CypressRunResult;
    ["13"]: CypressV13.CypressRunResult;
    ["14"]: CypressCommandLine.CypressRunResult;
}[T];

export type CypressFailedRunResult<T extends Version = Version> = {
    ["<13"]: CypressV12.CypressFailedRunResult;
    ["13"]: CypressV13.CypressFailedRunResult;
    ["14"]: CypressCommandLine.CypressFailedRunResult;
}[T];

export type ScreenshotDetails<T extends Version = Version> = {
    ["<13"]: CypressV12.ScreenshotDetails;
    ["13"]: CypressV13.ScreenshotDetails;
    ["14"]: Cypress.ScreenshotDetails;
}[T];
