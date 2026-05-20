import type * as CypressV12 from "./cypress-v12";
import type * as CypressV13 from "./cypress-v13";

export type CypressVersion = "<13" | ">=14" | "13";

export type RunResult<T extends CypressVersion = CypressVersion> = {
    ["<13"]: CypressV12.RunResult;
    [">=14"]: CypressCommandLine.RunResult;
    ["13"]: CypressV13.RunResult;
}[T];

export type CypressRunResult<T extends CypressVersion = CypressVersion> = {
    ["<13"]: CypressV12.CypressRunResult;
    [">=14"]: CypressCommandLine.CypressRunResult;
    ["13"]: CypressV13.CypressRunResult;
}[T];

export type CypressFailedRunResult<T extends CypressVersion = CypressVersion> = {
    ["<13"]: CypressV12.CypressFailedRunResult;
    [">=14"]: CypressCommandLine.CypressFailedRunResult;
    ["13"]: CypressV13.CypressFailedRunResult;
}[T];

export type ScreenshotDetails<T extends CypressVersion = CypressVersion> = {
    ["<13"]: CypressV12.ScreenshotDetails;
    [">=14"]: Cypress.ScreenshotDetails;
    ["13"]: CypressV13.ScreenshotDetails;
}[T];

export type PluginConfigOptions<T extends CypressVersion = CypressVersion> = {
    ["<13"]: CypressV12.PluginConfigOptions;
    [">=14"]: Cypress.PluginConfigOptions;
    ["13"]: CypressV13.PluginConfigOptions;
}[T];

export type ObjectLike<T extends CypressVersion = CypressVersion> = {
    ["<13"]: CypressV12.ObjectLike;
    [">=14"]: Cypress.ObjectLike;
    ["13"]: CypressV13.ObjectLike;
}[T];

export type FileObject<T extends CypressVersion = CypressVersion> = {
    ["<13"]: CypressV12.FileObject;
    [">=14"]: Cypress.FileObject;
    ["13"]: CypressV13.FileObject;
}[T];

export type RequestOptions<T extends CypressVersion = CypressVersion> = {
    ["<13"]: CypressV12.RequestOptions;
    [">=14"]: Cypress.RequestOptions;
    ["13"]: CypressV13.RequestOptions;
}[T];
