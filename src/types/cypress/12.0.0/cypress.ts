/* eslint-disable @typescript-eslint/naming-convention */
export interface ResolvedConfigOptions_V12<ComponentDevServerOpts = unknown> {
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
    nodeVersion: "system" | "bundled";
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
    videoUploadOnPasses: boolean;
    chromeWebSecurity: boolean;
    viewportHeight: number;
    viewportWidth: number;
    animationDistanceThreshold: number;
    waitForAnimations: boolean;
    scrollBehavior: scrollBehaviorOptions_V12;
    experimentalCspAllowList: boolean | experimentalCspAllowedDirectives_V12[];
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
    component: ComponentConfigOptions_V12<ComponentDevServerOpts>;
    e2e: EndToEndConfigOptions_V12;
    clientCertificates: ClientCertificate_V12[];
    indexHtmlFile: string;
}
export type TestingType_V12 = "e2e" | "component";
export type ConfigOptions_V12<ComponentDevServerOpts = unknown> = Partial<
    UserConfigOptions_V12<ComponentDevServerOpts>
> & {
    hosts?: null | Record<string, string>;
};
interface Auth_V12 {
    username: string;
    password: string;
}
interface RemoteState_V12 {
    auth?: Auth_V12;
    domainName: string;
    strategy: "file" | "http";
    origin: string;
    fileServer: string | null;
    props: Record<string, unknown>;
    visiting: string;
}
type BrowserName_V12 = "electron" | "chrome" | "chromium" | "firefox" | "edge";
type BrowserChannel_V12 = "stable" | "canary" | "beta" | "dev" | "nightly";
type BrowserFamily_V12 = "chromium" | "firefox" | "webkit";
interface Browser_V12 {
    name: BrowserName_V12;
    family: BrowserFamily_V12;
    channel: BrowserChannel_V12;
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
type CypressSpecType_V12 = "integration" | "component";
interface Spec {
    name: string;
    relative: string;
    absolute: string;
    specFilter?: string;
    specType?: CypressSpecType_V12;
}
interface Cypress_V12 {
    spec: Spec;
}
interface SinonSpyAgent_V12<A extends sinon.SinonSpy> {
    log(shouldOutput?: boolean): Omit<A, "withArgs"> & Agent_V12<A>;
    as(alias: string): Omit<A, "withArgs"> & Agent_V12<A>;
    withArgs(...args: unknown[]): Omit<A, "withArgs"> & Agent_V12<A>;
}
type Agent_V12<T extends sinon.SinonSpy> = SinonSpyAgent_V12<T> & T;
type experimentalCspAllowedDirectives_V12 =
    | "default-src"
    | "child-src"
    | "frame-src"
    | "script-src"
    | "script-src-elem"
    | "form-action";
type scrollBehaviorOptions_V12 = false | "center" | "top" | "bottom" | "nearest";
interface PEMCert_V12 {
    cert: string;
    key: string;
    passphrase?: string;
}
interface PFXCert_V12 {
    pfx: string;
    passphrase?: string;
}
interface ClientCertificate_V12 {
    url: string;
    ca?: string[];
    certs: PEMCert_V12[] | PFXCert_V12[];
}
interface EndToEndConfigOptions_V12 extends Omit<CoreConfigOptions_V12, "indexHtmlFile"> {
    experimentalRunAllSpecs?: boolean;
    experimentalOriginDependencies?: boolean;
}
interface RuntimeConfigOptions_V12 extends Partial<RuntimeServerConfigOptions_V12> {
    configFile: string;
    arch: string;
    browsers: Browser_V12[];
    hosts: null | Record<string, string>;
    isInteractive: boolean;
    platform: "linux" | "darwin" | "win32";
    remote: RemoteState_V12;
    version: string;
    namespace: string;
    projectRoot: string;
    repoRoot: string | null;
    devServerPublicPathRoute: string;
    cypressBinaryRoot: string;
}
interface RuntimeServerConfigOptions_V12 {
    browser: Browser_V12;
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
    remote: RemoteState_V12;
    report: boolean;
    reporterRoute: string;
    reporterUrl: string;
    socketId: null | string;
    socketIoCookie: string;
    socketIoRoute: string;
    spec: Cypress_V12["spec"] | null;
    specs: Cypress_V12["spec"][];
}
type CoreConfigOptions_V12 = Partial<Omit<ResolvedConfigOptions_V12, TestingType_V12>>;
type DefineDevServerConfig_V12 = Record<string, unknown>;
type PickConfigOpt_V12<T> = T extends keyof DefineDevServerConfig_V12
    ? DefineDevServerConfig_V12[T]
    : unknown;
interface AngularDevServerProjectConfig_V12 {
    root: string;
    sourceRoot: string;
    buildOptions: Record<string, unknown>;
}
type DevServerFn_V12<ComponentDevServerOpts = unknown> = (
    cypressDevServerConfig: DevServerConfig_V12,
    devServerConfig: ComponentDevServerOpts
) => ResolvedDevServerConfig_V12 | Promise<ResolvedDevServerConfig_V12>;
type ConfigHandler_V12<T> = T | (() => T | Promise<T>);
type DevServerConfigOptions_V12 =
    | {
          bundler: "webpack";
          framework: "react" | "vue" | "vue-cli" | "nuxt" | "create-react-app" | "next" | "svelte";
          webpackConfig?: ConfigHandler_V12<PickConfigOpt_V12<"webpackConfig">>;
      }
    | {
          bundler: "vite";
          framework: "react" | "vue" | "svelte";
          viteConfig?: ConfigHandler_V12<
              Omit<Exclude<PickConfigOpt_V12<"viteConfig">, undefined>, "base" | "root">
          >;
      }
    | {
          bundler: "webpack";
          framework: "angular";
          webpackConfig?: ConfigHandler_V12<PickConfigOpt_V12<"webpackConfig">>;
          options?: {
              projectConfig: AngularDevServerProjectConfig_V12;
          };
      };
interface ComponentConfigOptions_V12<ComponentDevServerOpts = unknown>
    extends Omit<CoreConfigOptions_V12, "baseUrl" | "experimentalStudio"> {
    devServer: DevServerFn_V12<ComponentDevServerOpts> | DevServerConfigOptions_V12;
    devServerConfig?: ComponentDevServerOpts;
    experimentalSingleTabRunMode?: boolean;
}
type UserConfigOptions_V12<ComponentDevServerOpts = unknown> = Omit<
    ResolvedConfigOptions_V12<ComponentDevServerOpts>,
    "baseUrl" | "excludeSpecPattern" | "supportFile" | "specPattern" | "indexHtmlFile"
>;
interface PluginConfigOptions_V12 extends ResolvedConfigOptions_V12, RuntimeConfigOptions_V12 {
    projectRoot: string;
    testingType: TestingType_V12;
    version: string;
}
interface DevServerConfig_V12 {
    specs: Spec[];
    cypressConfig: PluginConfigOptions_V12;
    devServerEvents: NodeJS.EventEmitter;
}
interface ResolvedDevServerConfig_V12 {
    port: number;
    close: (done?: (err?: Error) => unknown) => void;
}
