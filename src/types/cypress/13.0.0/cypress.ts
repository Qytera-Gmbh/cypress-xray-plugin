/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { CypressFailedRunResult, CypressRunResult, RunResult } from "./api";

/* eslint-disable @typescript-eslint/no-invalid-void-type */
export type TestingType = "e2e" | "component";
interface Auth {
    username: string;
    password: string;
}
interface RemoteState {
    auth?: Auth;
    domainName: string;
    strategy: "file" | "http";
    origin: string;
    fileServer: string | null;
    props: Record<string, unknown>;
    visiting: string;
}
type BrowserName = "electron" | "chrome" | "chromium" | "firefox" | "edge" | string;
type BrowserChannel = "stable" | "canary" | "beta" | "dev" | "nightly" | string;
type BrowserFamily = "chromium" | "firefox" | "webkit";
interface Browser {
    name: BrowserName;
    family: BrowserFamily;
    channel: BrowserChannel;
    displayName: string;
    version: string;
    majorVersion: number | string;
    path: string;
    isHeaded: boolean;
    isHeadless: boolean;
    info?: string;
    warning?: string;
    minSupportedVersion?: number;
    unsupportedVersion?: boolean;
}
export interface PublicBrowser {
    channel: BrowserChannel;
    displayName: string;
    family: string;
    majorVersion?: string | number | null;
    name: BrowserName;
    path: string;
    version: string;
}
type CypressSpecType = "integration" | "component";
interface Spec {
    name: string;
    relative: string;
    absolute: string;
    specFilter?: string;
    specType?: CypressSpecType;
}
interface Cypress {
    spec: Spec;
}
type experimentalCspAllowedDirectives =
    | "default-src"
    | "child-src"
    | "frame-src"
    | "script-src"
    | "script-src-elem"
    | "form-action";
type scrollBehaviorOptions = false | "center" | "top" | "bottom" | "nearest";
interface PEMCert {
    cert: string;
    key: string;
    passphrase?: string;
}
interface PFXCert {
    pfx: string;
    passphrase?: string;
}
interface ClientCertificate {
    url: string;
    ca?: string[];
    certs: PEMCert[] | PFXCert[];
}
export interface ResolvedConfigOptions<ComponentDevServerOpts = unknown> {
    baseUrl: string | null;
    env: Record<string, unknown>;
    excludeSpecPattern: string | string[];
    numTestsKeptInMemory: number;
    port: number | null;
    reporter: string;
    reporterOptions: Record<string, unknown>;
    slowTestThreshold: number;
    watchForFileChanges: boolean;
    defaultCommandTimeout: number;
    execTimeout: number;
    pageLoadTimeout: number;
    modifyObstructiveCode: boolean;
    requestTimeout: number;
    responseTimeout: number;
    taskTimeout: number;
    fileServerFolder: string;
    fixturesFolder: string | false;
    downloadsFolder: string;
    redirectionLimit: number;
    resolvedNodePath: string;
    resolvedNodeVersion: string;
    screenshotOnRunFailure: boolean;
    screenshotsFolder: string | false;
    supportFile: string | false;
    testIsolation: boolean;
    videosFolder: string;
    trashAssetsBeforeRuns: boolean;
    videoCompression: number | boolean;
    video: boolean;
    chromeWebSecurity: boolean;
    viewportHeight: number;
    viewportWidth: number;
    animationDistanceThreshold: number;
    waitForAnimations: boolean;
    scrollBehavior: scrollBehaviorOptions;
    experimentalCspAllowList: boolean | experimentalCspAllowedDirectives[];
    experimentalInteractiveRunEvents: boolean;
    experimentalModifyObstructiveThirdPartyCode: boolean;
    experimentalSkipDomainInjection: string[] | null;
    experimentalSourceRewriting: boolean;
    experimentalStudio: boolean;
    experimentalWebKitSupport: boolean;
    experimentalMemoryManagement: boolean;
    retries: number | { runMode?: number | null; openMode?: number | null } | null;
    includeShadowDom: boolean;
    blockHosts: null | string | string[];
    projectId: null | string;
    supportFolder: string;
    specPattern: string | string[];
    userAgent: null | string;
    experimentalFetchPolyfill: boolean;
    component: ComponentConfigOptions<ComponentDevServerOpts>;
    e2e: EndToEndConfigOptions;
    clientCertificates: ClientCertificate[];
    setupNodeEvents: (
        on: PluginEvents,
        config: PluginConfigOptions
    ) => Promise<PluginConfigOptions | void> | PluginConfigOptions | void;
    indexHtmlFile: string;
}
interface EndToEndConfigOptions extends Omit<CoreConfigOptions, "indexHtmlFile"> {
    experimentalRunAllSpecs?: boolean;
    experimentalOriginDependencies?: boolean;
}
interface RuntimeConfigOptions extends Partial<RuntimeServerConfigOptions> {
    configFile: string;
    arch: string;
    browsers: Browser[];
    hosts: null | Record<string, string>;
    isInteractive: boolean;
    platform: "linux" | "darwin" | "win32";
    remote: RemoteState;
    version: string;
    namespace: string;
    projectRoot: string;
    repoRoot: string | null;
    devServerPublicPathRoute: string;
    cypressBinaryRoot: string;
}
interface RuntimeServerConfigOptions {
    browser: Browser;
    autoOpen: boolean;
    browserUrl: string;
    clientRoute: string;
    cypressEnv: string;
    isNewProject: boolean;
    isTextTerminal: boolean;
    morgan: boolean;
    parentTestsFolder: string;
    parentTestsFolderDisplay: string;
    projectName: string;
    proxyUrl: string;
    remote: RemoteState;
    report: boolean;
    reporterRoute: string;
    reporterUrl: string;
    socketId: null | string;
    socketIoCookie: string;
    socketIoRoute: string;
    spec: Cypress["spec"] | null;
    specs: Cypress["spec"][];
    protocolEnabled: boolean;
    hideCommandLog: boolean;
    hideRunnerUi: boolean;
}
type CoreConfigOptions = Partial<Omit<ResolvedConfigOptions, TestingType>>;
type DefineDevServerConfig = Record<string, unknown>;
type PickConfigOpt<T> = T extends keyof DefineDevServerConfig ? DefineDevServerConfig[T] : unknown;
interface AngularDevServerProjectConfig {
    root: string;
    sourceRoot: string;
    buildOptions: Record<string, unknown>;
}
type DevServerFn<ComponentDevServerOpts = unknown> = (
    cypressDevServerConfig: DevServerConfig,
    devServerConfig: ComponentDevServerOpts
) => ResolvedDevServerConfig | Promise<ResolvedDevServerConfig>;
type ConfigHandler<T> = T | (() => T | Promise<T>);
type DevServerConfigOptions =
    | {
          bundler: "webpack";
          framework: "react" | "vue" | "vue-cli" | "nuxt" | "create-react-app" | "next" | "svelte";
          webpackConfig?: ConfigHandler<PickConfigOpt<"webpackConfig">>;
      }
    | {
          bundler: "vite";
          framework: "react" | "vue" | "svelte";
          // Commented out because:
          // Type 'string' does not satisfy the constraint 'never'.
          // Type 'string' is not assignable to type 'never'.
          //   viteConfig?: ConfigHandler<
          //       Omit<Exclude<PickConfigOpt<"viteConfig">, undefined>, "base" | "root">
          //   >;
      }
    | {
          bundler: "webpack";
          framework: "angular";
          webpackConfig?: ConfigHandler<PickConfigOpt<"webpackConfig">>;
          options?: {
              projectConfig: AngularDevServerProjectConfig;
          };
      };
interface ComponentConfigOptions<ComponentDevServerOpts = unknown>
    extends Omit<CoreConfigOptions, "baseUrl" | "experimentalStudio"> {
    devServer: DevServerFn<ComponentDevServerOpts> | DevServerConfigOptions;
    devServerConfig?: ComponentDevServerOpts;
    experimentalSingleTabRunMode?: boolean;
}
type UserConfigOptions<ComponentDevServerOpts = unknown> = Omit<
    ResolvedConfigOptions<ComponentDevServerOpts>,
    "baseUrl" | "excludeSpecPattern" | "supportFile" | "specPattern" | "indexHtmlFile"
>;
export type ConfigOptions<ComponentDevServerOpts = unknown> = Partial<
    UserConfigOptions<ComponentDevServerOpts>
> & {
    hosts?: null | Record<string, string>;
};
interface PluginConfigOptions extends ResolvedConfigOptions, RuntimeConfigOptions {
    projectRoot: string;
    testingType: TestingType;
    version: string;
}
interface Dimensions {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface BrowserLaunchOptions {
    extensions: string[];
    preferences: Record<string, unknown>;
    args: string[];
    env: Record<string, unknown>;
}
interface Dimensions {
    width: number;
    height: number;
}
interface ScreenshotDetails {
    size: number;
    takenAt: string;
    duration: number;
    dimensions: Dimensions;
    multipart: boolean;
    pixelRatio: number;
    name: string;
    specName: string;
    testFailure: boolean;
    path: string;
    scaled: boolean;
    blackout: string[];
}
interface AfterScreenshotReturnObject {
    path?: string;
    size?: number;
    dimensions?: Dimensions;
}
interface FileObject extends NodeEventEmitter {
    filePath: string;
    outputPath: string;
    shouldWatch: boolean;
}
type Task = (value: unknown) => unknown;
type Tasks = Record<string, Task>;
interface SystemDetails {
    osName: string;
    osVersion: string;
}
interface BeforeRunDetails {
    browser?: Browser;
    config: ConfigOptions;
    cypressVersion: string;
    group?: string;
    parallel?: boolean;
    runUrl?: string;
    specs?: Spec[];
    specPattern?: string[];
    system: SystemDetails;
    tag?: string;
    autoCancelAfterFailures?: number | false;
}
interface DevServerConfig {
    specs: Spec[];
    cypressConfig: PluginConfigOptions;
    devServerEvents: NodeJS.EventEmitter;
}
interface ResolvedDevServerConfig {
    port: number;
    close: (done?: (err?: Error) => unknown) => void;
}
interface PluginEvents {
    (
        action: "after:run",
        fn: (results: CypressRunResult | CypressFailedRunResult) => void | Promise<void>
    ): void;
    (
        action: "after:screenshot",
        fn: (
            details: ScreenshotDetails
        ) => void | AfterScreenshotReturnObject | Promise<AfterScreenshotReturnObject>
    ): void;
    (action: "after:spec", fn: (spec: Spec, results: RunResult) => void | Promise<void>): void;
    (action: "before:run", fn: (runDetails: BeforeRunDetails) => void | Promise<void>): void;
    (action: "before:spec", fn: (spec: Spec) => void | Promise<void>): void;
    (
        action: "before:browser:launch",
        fn: (
            browser: Browser,
            browserLaunchOptions: BrowserLaunchOptions
        ) => void | BrowserLaunchOptions | Promise<BrowserLaunchOptions>
    ): void;
    (action: "file:preprocessor", fn: (file: FileObject) => string | Promise<string>): void;
    (
        action: "dev-server:start",
        fn: (file: DevServerConfig) => Promise<ResolvedDevServerConfig>
    ): void;
    (action: "task", tasks: Tasks): void;
}
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
