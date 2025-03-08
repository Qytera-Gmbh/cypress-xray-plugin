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

export type PluginConfigOptions<T extends Version = Version> = {
    ["<13"]: CypressV12.PluginConfigOptions;
    ["13"]: CypressV13.PluginConfigOptions;
    ["14"]: Cypress.PluginConfigOptions;
}[T];

export type ObjectLike<T extends Version = Version> = {
    ["<13"]: CypressV12.ObjectLike;
    ["13"]: CypressV13.ObjectLike;
    ["14"]: Cypress.ObjectLike;
}[T];

export type FileObject<T extends Version = Version> = {
    ["<13"]: CypressV12.FileObject;
    ["13"]: CypressV13.FileObject;
    ["14"]: Cypress.FileObject;
}[T];

export type RequestOptions<T extends Version = Version> = {
    ["<13"]: CypressV12.RequestOptions;
    ["13"]: CypressV13.RequestOptions;
    ["14"]: Cypress.RequestOptions;
}[T];
