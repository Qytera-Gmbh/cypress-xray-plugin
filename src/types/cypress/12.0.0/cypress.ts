/* eslint-disable @typescript-eslint/naming-convention */
export interface ResolvedConfigOptions<ComponentDevServerOpts = unknown> {
    animationDistanceThreshold: number;
    baseUrl: null | string;
    blockHosts: null | string | string[];
    chromeWebSecurity: boolean;
    clientCertificates: ClientCertificate[];
    component: ComponentConfigOptions<ComponentDevServerOpts>;
    defaultCommandTimeout: number;
    downloadsFolder: string;
    e2e: EndToEndConfigOptions;
    env: Record<string, unknown>;
    excludeSpecPattern: string | string[];
    execTimeout: number;
    experimentalCspAllowList: boolean | experimentalCspAllowedDirectives[];
    experimentalFetchPolyfill: boolean;
    experimentalInteractiveRunEvents: boolean;
    experimentalMemoryManagement: boolean;
    experimentalModifyObstructiveThirdPartyCode: boolean;
    experimentalSkipDomainInjection: null | string[];
    experimentalSourceRewriting: boolean;
    experimentalStudio: boolean;
    experimentalWebKitSupport: boolean;
    fileServerFolder: string;
    fixturesFolder: false | string;
    includeShadowDom: boolean;
    indexHtmlFile: string;
    modifyObstructiveCode: boolean;
    nodeVersion: "bundled" | "system";
    numTestsKeptInMemory: number;
    pageLoadTimeout: number;
    port: null | number;
    projectId: null | string;
    redirectionLimit: number;
    reporter: string;
    reporterOptions: Record<string, unknown>;
    requestTimeout: number;
    resolvedNodePath: string;
    resolvedNodeVersion: string;
    responseTimeout: number;
    retries: { openMode?: null | number; runMode?: null | number } | null | number;
    screenshotOnRunFailure: boolean;
    screenshotsFolder: false | string;
    scrollBehavior: scrollBehaviorOptions;
    slowTestThreshold: number;
    specPattern: string | string[];
    supportFile: false | string;
    supportFolder: string;
    taskTimeout: number;
    testIsolation: boolean;
    trashAssetsBeforeRuns: boolean;
    userAgent: null | string;
    video: boolean;
    videoCompression: boolean | number;
    videosFolder: string;
    videoUploadOnPasses: boolean;
    viewportHeight: number;
    viewportWidth: number;
    waitForAnimations: boolean;
    watchForFileChanges: boolean;
}
export type TestingType = "component" | "e2e";
export type ConfigOptions<ComponentDevServerOpts = unknown> = Partial<
    UserConfigOptions<ComponentDevServerOpts>
> & {
    hosts?: null | Record<string, string>;
};
export interface PluginConfigOptions extends ResolvedConfigOptions, RuntimeConfigOptions {
    projectRoot: string;
    testingType: TestingType;
    version: string;
}
interface Auth {
    password: string;
    username: string;
}
interface RemoteState {
    auth?: Auth;
    domainName: string;
    fileServer: null | string;
    origin: string;
    props: Record<string, unknown>;
    strategy: "file" | "http";
    visiting: string;
}
type BrowserName = "chrome" | "chromium" | "edge" | "electron" | "firefox";
type BrowserChannel = "beta" | "canary" | "dev" | "nightly" | "stable";
type BrowserFamily = "chromium" | "firefox" | "webkit";
interface Browser {
    channel: BrowserChannel;
    displayName: string;
    family: BrowserFamily;
    info?: string;
    isHeaded: boolean;
    isHeadless: boolean;
    majorVersion: number | string;
    minSupportedVersion?: number;
    name: BrowserName;
    path: string;
    unsupportedVersion?: boolean;
    version: string;
    warning?: string;
}
type CypressSpecType = "component" | "integration";
interface Spec {
    absolute: string;
    name: string;
    relative: string;
    specFilter?: string;
    specType?: CypressSpecType;
}
interface Cypress {
    spec: Spec;
}
interface SinonSpyAgent<A extends sinon.SinonSpy> {
    as(alias: string): Omit<A, "withArgs"> & Agent<A>;
    log(shouldOutput?: boolean): Omit<A, "withArgs"> & Agent<A>;
    withArgs(...args: unknown[]): Omit<A, "withArgs"> & Agent<A>;
}
type Agent<T extends sinon.SinonSpy> = SinonSpyAgent<T> & T;
type experimentalCspAllowedDirectives =
    | "child-src"
    | "default-src"
    | "form-action"
    | "frame-src"
    | "script-src-elem"
    | "script-src";
type scrollBehaviorOptions = "bottom" | "center" | "nearest" | "top" | false;
interface PEMCert {
    cert: string;
    key: string;
    passphrase?: string;
}
interface PFXCert {
    passphrase?: string;
    pfx: string;
}
interface ClientCertificate {
    ca?: string[];
    certs: PEMCert[] | PFXCert[];
    url: string;
}
interface EndToEndConfigOptions extends Omit<CoreConfigOptions, "indexHtmlFile"> {
    experimentalOriginDependencies?: boolean;
    experimentalRunAllSpecs?: boolean;
}
interface RuntimeConfigOptions extends Partial<RuntimeServerConfigOptions> {
    arch: string;
    browsers: Browser[];
    configFile: string;
    cypressBinaryRoot: string;
    devServerPublicPathRoute: string;
    hosts: null | Record<string, string>;
    isInteractive: boolean;
    namespace: string;
    platform: "darwin" | "linux" | "win32";
    projectRoot: string;
    remote: RemoteState;
    repoRoot: null | string;
    version: string;
}
interface RuntimeServerConfigOptions {
    autoOpen: boolean;
    browser: Browser;
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
}
type CoreConfigOptions = Partial<Omit<ResolvedConfigOptions, TestingType>>;
type DefineDevServerConfig = Record<string, unknown>;
type PickConfigOpt<T> = T extends keyof DefineDevServerConfig ? DefineDevServerConfig[T] : unknown;
interface AngularDevServerProjectConfig {
    buildOptions: Record<string, unknown>;
    root: string;
    sourceRoot: string;
}
type DevServerFn<ComponentDevServerOpts = unknown> = (
    cypressDevServerConfig: DevServerConfig,
    devServerConfig: ComponentDevServerOpts
) => Promise<ResolvedDevServerConfig> | ResolvedDevServerConfig;
type ConfigHandler<T> = (() => Promise<T> | T) | T;
type DevServerConfigOptions =
    | {
          bundler: "vite";
          framework: "react" | "svelte" | "vue";
          viteConfig?: ConfigHandler<
              Omit<Exclude<PickConfigOpt<"viteConfig">, undefined>, "base" | "root">
          >;
      }
    | {
          bundler: "webpack";
          framework: "angular";
          options?: {
              projectConfig: AngularDevServerProjectConfig;
          };
          webpackConfig?: ConfigHandler<PickConfigOpt<"webpackConfig">>;
      }
    | {
          bundler: "webpack";
          framework: "create-react-app" | "next" | "nuxt" | "react" | "svelte" | "vue-cli" | "vue";
          webpackConfig?: ConfigHandler<PickConfigOpt<"webpackConfig">>;
      };
interface ComponentConfigOptions<ComponentDevServerOpts = unknown>
    extends Omit<CoreConfigOptions, "baseUrl" | "experimentalStudio"> {
    devServer: DevServerConfigOptions | DevServerFn<ComponentDevServerOpts>;
    devServerConfig?: ComponentDevServerOpts;
    experimentalSingleTabRunMode?: boolean;
}
type UserConfigOptions<ComponentDevServerOpts = unknown> = Omit<
    ResolvedConfigOptions<ComponentDevServerOpts>,
    "baseUrl" | "excludeSpecPattern" | "indexHtmlFile" | "specPattern" | "supportFile"
>;
interface DevServerConfig {
    cypressConfig: PluginConfigOptions;
    devServerEvents: NodeJS.EventEmitter;
    specs: Spec[];
}
interface ResolvedDevServerConfig {
    close: (done?: (err?: Error) => unknown) => void;
    port: number;
}
