/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { CypressFailedRunResult_V13, CypressRunResult_V13, RunResult_V13 } from "./api";

/* eslint-disable @typescript-eslint/no-invalid-void-type */
export type TestingType_V13 = "e2e" | "component";
interface Auth_V13 {
    username: string;
    password: string;
}
interface RemoteState_V13 {
    auth?: Auth_V13;
    domainName: string;
    strategy: "file" | "http";
    origin: string;
    fileServer: string | null;
    props: Record<string, unknown>;
    visiting: string;
}
type BrowserName_V13 = "electron" | "chrome" | "chromium" | "firefox" | "edge" | string;
type BrowserChannel_V13 = "stable" | "canary" | "beta" | "dev" | "nightly" | string;
type BrowserFamily_V13 = "chromium" | "firefox" | "webkit";
interface Browser_V13 {
    name: BrowserName_V13;
    family: BrowserFamily_V13;
    channel: BrowserChannel_V13;
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
export interface PublicBrowser_V13 {
    channel: BrowserChannel_V13;
    displayName: string;
    family: string;
    majorVersion?: string | number | null;
    name: BrowserName_V13;
    path: string;
    version: string;
}
type CypressSpecType_V13 = "integration" | "component";
interface Spec {
    name: string;
    relative: string;
    absolute: string;
    specFilter?: string;
    specType?: CypressSpecType_V13;
}
interface Cypress {
    spec: Spec;
}
type experimentalCspAllowedDirectives_V13 =
    | "default-src"
    | "child-src"
    | "frame-src"
    | "script-src"
    | "script-src-elem"
    | "form-action";
type scrollBehaviorOptions_V13 = false | "center" | "top" | "bottom" | "nearest";
interface PEMCert_V13 {
    cert: string;
    key: string;
    passphrase?: string;
}
interface PFXCert_V13 {
    pfx: string;
    passphrase?: string;
}
interface ClientCertificate_V13 {
    url: string;
    ca?: string[];
    certs: PEMCert_V13[] | PFXCert_V13[];
}
export interface ResolvedConfigOptions_V13<ComponentDevServerOpts = unknown> {
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
    scrollBehavior: scrollBehaviorOptions_V13;
    experimentalCspAllowList: boolean | experimentalCspAllowedDirectives_V13[];
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
    component: ComponentConfigOptions_V13<ComponentDevServerOpts>;
    e2e: EndToEndConfigOptions_V13;
    clientCertificates: ClientCertificate_V13[];
    setupNodeEvents: (
        on: PluginEvents_V13,
        config: PluginConfigOptions_V13
    ) => Promise<PluginConfigOptions_V13 | void> | PluginConfigOptions_V13 | void;
    indexHtmlFile: string;
}
interface EndToEndConfigOptions_V13 extends Omit<CoreConfigOptions_V13, "indexHtmlFile"> {
    experimentalRunAllSpecs?: boolean;
    experimentalOriginDependencies?: boolean;
}
interface RuntimeConfigOptions_V13 extends Partial<RuntimeServerConfigOptions_V13> {
    configFile: string;
    arch: string;
    browsers: Browser_V13[];
    hosts: null | Record<string, string>;
    isInteractive: boolean;
    platform: "linux" | "darwin" | "win32";
    remote: RemoteState_V13;
    version: string;
    namespace: string;
    projectRoot: string;
    repoRoot: string | null;
    devServerPublicPathRoute: string;
    cypressBinaryRoot: string;
}
interface RuntimeServerConfigOptions_V13 {
    browser: Browser_V13;
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
    remote: RemoteState_V13;
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
type CoreConfigOptions_V13 = Partial<Omit<ResolvedConfigOptions_V13, TestingType_V13>>;
type DefineDevServerConfig_V13 = Record<string, unknown>;
type PickConfigOpt_V13<T> = T extends keyof DefineDevServerConfig_V13
    ? DefineDevServerConfig_V13[T]
    : unknown;
interface AngularDevServerProjectConfig {
    root: string;
    sourceRoot: string;
    buildOptions: Record<string, unknown>;
}
type DevServerFn_V13<ComponentDevServerOpts = unknown> = (
    cypressDevServerConfig: DevServerConfig_V13,
    devServerConfig: ComponentDevServerOpts
) => ResolvedDevServerConfig_V13 | Promise<ResolvedDevServerConfig_V13>;
type ConfigHandler_V13<T> = T | (() => T | Promise<T>);
type DevServerConfigOptions_V13 =
    | {
          bundler: "webpack";
          framework: "react" | "vue" | "vue-cli" | "nuxt" | "create-react-app" | "next" | "svelte";
          webpackConfig?: ConfigHandler_V13<PickConfigOpt_V13<"webpackConfig">>;
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
          webpackConfig?: ConfigHandler_V13<PickConfigOpt_V13<"webpackConfig">>;
          options?: {
              projectConfig: AngularDevServerProjectConfig;
          };
      };
interface ComponentConfigOptions_V13<ComponentDevServerOpts = unknown>
    extends Omit<CoreConfigOptions_V13, "baseUrl" | "experimentalStudio"> {
    devServer: DevServerFn_V13<ComponentDevServerOpts> | DevServerConfigOptions_V13;
    devServerConfig?: ComponentDevServerOpts;
    experimentalSingleTabRunMode?: boolean;
}
type UserConfigOptions_V13<ComponentDevServerOpts = unknown> = Omit<
    ResolvedConfigOptions_V13<ComponentDevServerOpts>,
    "baseUrl" | "excludeSpecPattern" | "supportFile" | "specPattern" | "indexHtmlFile"
>;
export type ConfigOptions_V13<ComponentDevServerOpts = unknown> = Partial<
    UserConfigOptions_V13<ComponentDevServerOpts>
> & {
    hosts?: null | Record<string, string>;
};
interface PluginConfigOptions_V13 extends ResolvedConfigOptions_V13, RuntimeConfigOptions_V13 {
    projectRoot: string;
    testingType: TestingType_V13;
    version: string;
}
interface Dimensions_V13 {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface BrowserLaunchOptions_V13 {
    extensions: string[];
    preferences: Record<string, unknown>;
    args: string[];
    env: Record<string, unknown>;
}
interface Dimensions_V13 {
    width: number;
    height: number;
}
interface ScreenshotDetails_V13 {
    size: number;
    takenAt: string;
    duration: number;
    dimensions: Dimensions_V13;
    multipart: boolean;
    pixelRatio: number;
    name: string;
    specName: string;
    testFailure: boolean;
    path: string;
    scaled: boolean;
    blackout: string[];
}
interface AfterScreenshotReturnObject_V13 {
    path?: string;
    size?: number;
    dimensions?: Dimensions_V13;
}
interface FileObject_V13 extends NodeEventEmitter {
    filePath: string;
    outputPath: string;
    shouldWatch: boolean;
}
type Task_V13 = (value: unknown) => unknown;
type Tasks_V13 = Record<string, Task_V13>;
interface SystemDetails_V13 {
    osName: string;
    osVersion: string;
}
interface BeforeRunDetails_V13 {
    browser?: Browser_V13;
    config: ConfigOptions_V13;
    cypressVersion: string;
    group?: string;
    parallel?: boolean;
    runUrl?: string;
    specs?: Spec[];
    specPattern?: string[];
    system: SystemDetails_V13;
    tag?: string;
    autoCancelAfterFailures?: number | false;
}
interface DevServerConfig_V13 {
    specs: Spec[];
    cypressConfig: PluginConfigOptions_V13;
    devServerEvents: NodeJS.EventEmitter;
}
interface ResolvedDevServerConfig_V13 {
    port: number;
    close: (done?: (err?: Error) => unknown) => void;
}
interface PluginEvents_V13 {
    (
        action: "after:run",
        fn: (results: CypressRunResult_V13 | CypressFailedRunResult_V13) => void | Promise<void>
    ): void;
    (
        action: "after:screenshot",
        fn: (
            details: ScreenshotDetails_V13
        ) => void | AfterScreenshotReturnObject_V13 | Promise<AfterScreenshotReturnObject_V13>
    ): void;
    (action: "after:spec", fn: (spec: Spec, results: RunResult_V13) => void | Promise<void>): void;
    (action: "before:run", fn: (runDetails: BeforeRunDetails_V13) => void | Promise<void>): void;
    (action: "before:spec", fn: (spec: Spec) => void | Promise<void>): void;
    (
        action: "before:browser:launch",
        fn: (
            browser: Browser_V13,
            browserLaunchOptions: BrowserLaunchOptions_V13
        ) => void | BrowserLaunchOptions_V13 | Promise<BrowserLaunchOptions_V13>
    ): void;
    (action: "file:preprocessor", fn: (file: FileObject_V13) => string | Promise<string>): void;
    (
        action: "dev-server:start",
        fn: (file: DevServerConfig_V13) => Promise<ResolvedDevServerConfig_V13>
    ): void;
    (action: "task", tasks: Tasks_V13): void;
}
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
