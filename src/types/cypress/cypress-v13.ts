/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/unified-signatures */

// ============================================================================================== //
// See: https://github.com/cypress-io/cypress/blob/v13.17.0/cli/types/cypress-npm-api.d.ts
// ============================================================================================== //

export interface CypressRunOptions extends CypressCommonOptions {
    autoCancelAfterFailures: false | number;
    browser: string;
    ciBuildId: string;
    group: string;
    headed: boolean;
    headless: boolean;
    key: string;
    noExit: boolean;
    parallel: boolean;
    port: number;
    quiet: boolean;
    record: boolean;
    reporter: string;
    reporterOptions: any;
    runnerUi: boolean;
    spec: string;
    tag: string;
}
export interface CypressOpenOptions extends CypressCommonOptions {
    browser: string;
    detached: boolean;
    global: boolean;
    port: number;
}
export interface CypressCommonOptions {
    config: ConfigOptions;
    configFile: string;
    env: object;
    project: string;
    testingType: TestingType;
}
type dateTimeISO = string;
type ms = number;
type pixels = number;
export interface TestResult {
    attempts: AttemptResult[];
    displayError: null | string;
    duration: number;
    state: string;
    title: string[];
}

export interface AttemptResult {
    state: string;
}
export interface ScreenshotInformation {
    height: pixels;
    name: string;
    path: string;
    takenAt: dateTimeISO;
    width: pixels;
}
export interface SpecResult {
    absolute: string;
    fileExtension: string;
    fileName: string;
    name: string;
    relative: string;
}
export interface RunResult {
    error: null | string;
    reporter: string;
    reporterStats: object;
    screenshots: ScreenshotInformation[];
    spec: SpecResult;
    stats: {
        duration?: ms;
        endedAt: dateTimeISO;
        failures: number;
        passes: number;
        pending: number;
        skipped: number;
        startedAt: dateTimeISO;
        suites: number;
        tests: number;
    };
    tests: TestResult[];
    video: null | string;
}

type PublicConfig = Omit<ResolvedConfigOptions, "setupNodeEvents" | "supportFolder"> & {
    browsers: PublicBrowser[];
    cypressInternalEnv: string;
};
export interface CypressRunResult {
    browserName: string;
    browserPath: string;
    browserVersion: string;
    config: PublicConfig;
    cypressVersion: string;
    endedTestsAt: dateTimeISO;
    osName: string;
    osVersion: string;
    runs: RunResult[];
    runUrl?: string;
    startedTestsAt: dateTimeISO;
    totalDuration: number;
    totalFailed: number;
    totalPassed: number;
    totalPending: number;
    totalSkipped: number;
    totalSuites: number;
    totalTests: number;
}
export interface CypressFailedRunResult {
    failures: number;
    message: string;
    status: "failed";
}
export interface CypressCliParser {
    parseRunArguments(args: string[]): Promise<Partial<CypressRunOptions>>;
}

// ============================================================================================== //
// See: https://github.com/cypress-io/cypress/blob/v13.17.0/cli/types/cypress.d.ts
// ============================================================================================== //

export type FileContents = any[] | object | string;
export type HistoryDirection = "back" | "forward";
export type HttpMethod = string;
export type RequestBody = boolean | null | object | string;
export type ViewportOrientation = "landscape" | "portrait";
export type PrevSubject = keyof PrevSubjectMap;
export type TestingType = "component" | "e2e";
export type PluginConfig = (
    on: PluginEvents,
    config: PluginConfigOptions
) => ConfigOptions | Promise<ConfigOptions> | undefined;
export interface JQueryWithSelector<TElement = HTMLElement> extends JQuery<TElement> {
    selector?: null | string;
}
export interface PrevSubjectMap<O = unknown> {
    document: Document;
    element: JQueryWithSelector;
    optional: O;
    window: Window;
}
export interface CommandOptions {
    prevSubject: boolean | PrevSubject | PrevSubject[];
}
export type CommandFn<T extends keyof ChainableMethods> = (
    this: Mocha.Context,
    ...args: Parameters<ChainableMethods[T]>
) => ReturnType<ChainableMethods[T]> | undefined;
export type CommandFns = Record<string, (this: Mocha.Context, ...args: any) => any>;
export type CommandFnWithSubject<T extends keyof ChainableMethods, S> = (
    this: Mocha.Context,
    prevSubject: S,
    ...args: Parameters<ChainableMethods[T]>
) => ReturnType<ChainableMethods[T]> | undefined;
export type CommandFnsWithSubject<S> = Record<
    string,
    (this: Mocha.Context, prevSubject: S, ...args: any) => any
>;
export interface CommandOriginalFn<T extends keyof ChainableMethods> extends CallableFunction {
    (...args: Parameters<ChainableMethods[T]>): ReturnType<ChainableMethods[T]>;
}
export interface CommandOriginalFnWithSubject<T extends keyof ChainableMethods, S>
    extends CallableFunction {
    (prevSubject: S, ...args: Parameters<ChainableMethods[T]>): ReturnType<ChainableMethods[T]>;
}
export type CommandFnWithOriginalFn<T extends keyof Chainable> = (
    this: Mocha.Context,
    originalFn: CommandOriginalFn<T>,
    ...args: Parameters<ChainableMethods[T]>
) => ReturnType<ChainableMethods[T]> | undefined;
export type CommandFnWithOriginalFnAndSubject<T extends keyof Chainable, S> = (
    this: Mocha.Context,
    originalFn: CommandOriginalFnWithSubject<T, S>,
    prevSubject: S,
    ...args: Parameters<ChainableMethods[T]>
) => ReturnType<ChainableMethods[T]> | undefined;
export type QueryFn<T extends keyof ChainableMethods> = (
    this: Command,
    ...args: Parameters<ChainableMethods[T]>
) => (subject: any) => any;
export type QueryFnWithOriginalFn<T extends keyof Chainable> = (
    this: Command,
    originalFn: QueryFn<T>,
    ...args: Parameters<ChainableMethods[T]>
) => (subject: any) => any;
export type ObjectLike = Record<string, any>;
export interface Auth {
    password: string;
    username: string;
}
export interface RemoteState {
    auth?: Auth;
    domainName: string;
    fileServer: null | string;
    origin: string;
    props: Record<string, any>;
    strategy: "file" | "http";
    visiting: string;
}
export interface Backend {
    (task: "firefox:force:gc"): Promise<void>;
    (task: "net", eventName: string, frame: any): Promise<void>;
}
export type BrowserName = "chrome" | "chromium" | "edge" | "electron" | "firefox" | string;
export type BrowserChannel = "beta" | "canary" | "dev" | "nightly" | "stable" | string;
export type BrowserFamily = "chromium" | "firefox" | "webkit";
export interface Browser {
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
export interface PublicBrowser {
    channel: BrowserChannel;
    displayName: string;
    family: string;
    majorVersion?: null | number | string;
    name: BrowserName;
    path: string;
    version: string;
}
export interface Ensure {
    isAttached(subject: any, commandName: string, cy: Chainable, onFail?: Log): void;
    isDocument(subject: any, commandName: string, cy: Chainable): void;
    isElement(subject: any, commandName: string, cy: Chainable): void;
    isNotDisabled(subject: any, commandName: string, onFail?: Log): void;
    isNotHiddenByAncestors(subject: any, commandName: string, onFail?: Log): void;
    isNotReadonly(subject: any, commandName: string, onFail?: Log): void;
    isScrollable(subject: any, commandName: string, onFail?: Log): void;
    isType(subject: any, type: PrevSubject[], commandName: string, cy: Chainable): void;
    isVisible(subject: any, commandName: string, onFail?: Log): void;
    isWindow(subject: any, commandName: string, cy: Chainable): void;
}
export interface LocalStorage {
    clear: (keys?: string[]) => void;
}
export type Storable = boolean | null | number | StorableArray | StorableObject | string;
export interface StorableObject {
    [key: string]: Storable;
}
export type StorableArray = Storable[];
export type StorableRecord = Record<string, Storable>;
export interface OriginStorage {
    origin: string;
    value: StorableRecord;
}
export interface Storages {
    localStorage: OriginStorage[];
    sessionStorage: OriginStorage[];
}
export type StorageByOrigin = Record<string, StorableRecord>;
export type IsBrowserMatcher = (BrowserName | Partial<Browser>)[] | BrowserName | Partial<Browser>;
export interface ViewportPosition extends WindowPosition {
    bottom: number;
    right: number;
}
export interface WindowPosition {
    left: number;
    leftCenter: number;
    top: number;
    topCenter: number;
}
export interface ElementPositioning {
    fromAutWindow: WindowPosition;
    fromElViewport: ViewportPosition;
    fromElWindow: WindowPosition;
    height: number;
    scrollLeft: number;
    scrollTop: number;
    width: number;
}
export interface ElementCoordinates {
    fromAutWindow: WindowPosition & { x: number; y: number };
    fromElViewport: ViewportPosition & { x: number; y: number };
    fromElWindow: WindowPosition & { x: number; y: number };
    height: number;
    width: number;
}
export type CypressSpecType = "component" | "integration";
export interface Spec {
    absolute: string;
    baseName?: string;
    fileExtension?: string;
    fileName?: string;
    id?: string;
    name: string;
    relative: string;
    specFilter?: string;
    specType?: CypressSpecType;
}
export type AUTWindow = Window & typeof globalThis & ApplicationWindow;
export type ApplicationWindow = object;
export type Config = ResolvedConfigOptions & RuntimeConfigOptions & RuntimeServerConfigOptions;
export interface Cypress {
    _: _.LoDashStatic;
    $: JQueryStatic;
    action: (action: string, ...args: any[]) => unknown;
    arch: string;
    automation(eventName: string, ...args: any[]): Bluebird.Promise<any>;
    backend: Backend;
    Blob: BlobUtil.BlobUtilStatic;
    browser: Browser;
    Buffer: BufferType;
    Commands: {
        add<T extends keyof Chainable>(name: T, fn: CommandFn<T>): void;
        add<T extends keyof Chainable>(
            name: T,
            options: CommandOptions & { prevSubject: false },
            fn: CommandFn<T>
        ): void;
        add<T extends keyof Chainable, S = any>(
            name: T,
            options: CommandOptions & { prevSubject: true },
            fn: CommandFnWithSubject<T, S>
        ): void;
        add<T extends keyof Chainable, S extends PrevSubject>(
            name: T,
            options: CommandOptions & { prevSubject: ["optional"] | S },
            fn: CommandFnWithSubject<T, PrevSubjectMap[S]>
        ): void;
        add<T extends keyof Chainable, S extends PrevSubject>(
            name: T,
            options: CommandOptions & { prevSubject: S[] },
            fn: CommandFnWithSubject<T, PrevSubjectMap<void>[S]>
        ): void;
        addAll(fns: CommandFns): void;
        addAll(options: CommandOptions & { prevSubject: false }, fns: CommandFns): void;
        addAll<S = any>(
            options: CommandOptions & { prevSubject: true },
            fns: CommandFnsWithSubject<S>
        ): void;
        addAll<S extends PrevSubject>(
            options: CommandOptions & { prevSubject: ["optional"] | S },
            fns: CommandFnsWithSubject<PrevSubjectMap[S]>
        ): void;
        addAll<S extends PrevSubject>(
            options: CommandOptions & { prevSubject: S[] },
            fns: CommandFnsWithSubject<PrevSubjectMap<void>[S]>
        ): void;
        addQuery<T extends keyof Chainable>(name: T, fn: QueryFn<T>): void;
        overwrite<T extends keyof Chainable>(name: T, fn: CommandFnWithOriginalFn<T>): void;
        overwrite<T extends keyof Chainable, S extends PrevSubject>(
            name: T,
            fn: CommandFnWithOriginalFnAndSubject<T, PrevSubjectMap[S]>
        ): void;
        overwriteQuery<T extends keyof Chainable>(name: T, fn: QueryFnWithOriginalFn<T>): void;
    };
    config(): Config;
    config<K extends keyof Config>(key: K): Config[K];
    config<K extends keyof TestConfigOverrides>(key: K, value: TestConfigOverrides[K]): void;
    config(Object: TestConfigOverrides): void;
    Cookies: {
        debug(enabled: boolean, options?: Partial<DebugOptions>): void;
    };
    currentRetry: number;
    currentTest: {
        title: string;
        titlePath: string[];
    };
    dom: {
        getContainsSelector(
            text: string,
            filter?: string,
            options?: CaseMatchable
        ): JQuery.Selector;
        getCoordsByPosition(
            left: number,
            top: number,
            xPosition?: string,
            yPosition?: string
        ): number;
        getElementAtPointFromViewport(doc: Document, x: number, y: number): Element | null;
        getElementCoordinatesByPosition(
            element: HTMLElement | JQuery,
            position: string
        ): ElementCoordinates;
        getElementCoordinatesByPositionRelativeToXY(
            element: HTMLElement | JQuery,
            x: number,
            y: number
        ): ElementPositioning;
        getElementPositioning(element: HTMLElement | JQuery): ElementPositioning;
        getElements(element: JQuery): HTMLElement[] | JQuery;
        getFirstDeepestElement(elements: HTMLElement[], index?: number): HTMLElement;
        getFirstFixedOrStickyPositionParent(element: HTMLElement | JQuery): HTMLElement | JQuery;
        getFirstScrollableParent(element: HTMLElement | JQuery): HTMLElement | JQuery;
        getFirstStickyPositionParent(element: HTMLElement | JQuery): HTMLElement | JQuery;
        getReasonIsHidden(element: HTMLElement | JQuery, options?: object): string;
        getWindowByElement(element: HTMLElement | JQuery): HTMLElement | JQuery;
        isAttached(element: Document | HTMLElement | JQuery | Window): boolean;
        isDescendent(element1: HTMLElement | JQuery, element2: HTMLElement | JQuery): boolean;
        isDetached(element: HTMLElement | JQuery): boolean;
        isDocument(obj: any): boolean;
        isDom(obj: any): boolean;
        isElement(obj: any): boolean;
        isFocusable(element: HTMLElement | JQuery): boolean;
        isFocused(element: HTMLElement | JQuery): boolean;
        isHidden(element: HTMLElement | JQuery, methodName?: string, options?: object): boolean;
        isInputType(element: HTMLElement | JQuery, type: string | string[]): boolean;
        isJquery(obj: any): obj is JQuery;
        isScrollable(element: HTMLElement | JQuery | Window): boolean;
        isSelector(element: HTMLElement | JQuery, selector: JQuery.Selector): boolean;
        isTextLike(element: HTMLElement | JQuery): boolean;
        isType(element: HTMLElement | JQuery, type: string): boolean;
        isUndefinedOrHTMLBodyDoc(obj: any): boolean;
        isVisible(element: HTMLElement | JQuery): boolean;
        isWindow(obj: any): obj is Window;
        query(selector: JQuery.Selector, context?: Element | JQuery): JQuery;
        stringify(element: HTMLElement | JQuery, form: string): string;
        unwrap(obj: any): any;
        wrap(
            wrappingElement_function:
                | ((index: number) => JQuery | string)
                | Element
                | JQuery
                | JQuery.htmlString
        ): JQuery;
    };
    ensure: Ensure;
    env(): ObjectLike;
    env(key: string): any;
    env(key: string, value: any): void;
    env(object: ObjectLike): void;
    getTestRetries(): null | number;
    isBrowser(name: IsBrowserMatcher): boolean;
    isCy<TSubject = any>(obj: Chainable<TSubject>): obj is Chainable<TSubject>;
    isCy(obj: any): obj is Chainable;
    Keyboard: {
        defaults(options: Partial<KeyboardDefaultsOptions>): void;
    };
    LocalStorage: LocalStorage;
    log(options: Partial<LogConfig>): Log;
    off: Actions;
    on: Actions;
    once: Actions;
    onSpecWindow: (window: Window, specList: (() => Promise<void>)[] | string[]) => void;
    platform: string;
    Promise: Bluebird.BluebirdStatic;
    require: (id: string) => unknown;
    Screenshot: {
        defaults(options: Partial<ScreenshotDefaultsOptions>): void;
    };
    SelectorPlayground: {
        defaults(options: Partial<SelectorPlaygroundDefaultsOptions>): void;
        getSelector($el: JQuery): JQuery.Selector;
    };
    session: Session;
    sinon: sinon.SinonStatic;
    spec: Spec;
    testingType: TestingType;
    version: string;
}
export type CanReturnChainable = Chainable | Promise<unknown> | undefined;
export type ThenReturn<S, R> = R extends undefined
    ? Chainable<S>
    : R extends R | undefined
      ? Chainable<Exclude<R, undefined> | S>
      : Chainable<S>;
export interface Chainable<Subject = any> {
    $$<TElement extends Element = HTMLElement>(
        selector: JQuery.Selector,
        context?: Document | Element | JQuery
    ): JQuery<TElement>;
    and: Chainer<Subject>;
    as(alias: string, options?: Partial<AsOptions>): Chainable<Subject>;
    blur(options?: Partial<BlurOptions>): Chainable<Subject>;
    check(options?: Partial<CheckOptions>): Chainable<Subject>;
    check(value: string | string[], options?: Partial<CheckOptions>): Chainable<Subject>;
    children<E extends Node = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    children<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    children<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    clear(options?: Partial<ClearOptions>): Chainable<Subject>;
    clearAllCookies(options?: Partial<Loggable & Timeoutable>): Chainable<null>;
    clearAllLocalStorage(options?: Partial<Loggable>): Chainable<null>;
    clearAllSessionStorage(options?: Partial<Loggable>): Chainable<null>;
    clearCookie(name: string, options?: CookieOptions): Chainable<null>;
    clearCookies(options?: CookieOptions): Chainable<null>;
    clearLocalStorage(key?: string): Chainable<Storage>;
    clearLocalStorage(re: RegExp): Chainable<Storage>;
    clearLocalStorage(options: Partial<Loggable>): Chainable<Storage>;
    clearLocalStorage(key: string, options: Partial<Loggable>): Chainable<Storage>;
    click(options?: Partial<ClickOptions>): Chainable<Subject>;
    click(position: PositionType, options?: Partial<ClickOptions>): Chainable<Subject>;
    click(x: number, y: number, options?: Partial<ClickOptions>): Chainable<Subject>;
    clock(): Chainable<Clock>;
    clock(now: Date | number, options?: Loggable): Chainable<Clock>;
    clock(
        now: Date | number,
        functions?: ("clearInterval" | "clearTimeout" | "Date" | "setInterval" | "setTimeout")[],
        options?: Loggable
    ): Chainable<Clock>;
    clock(options: Loggable): Chainable<Clock>;
    closest<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    closest<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    contains(
        content: number | RegExp | string,
        options?: Partial<Loggable & Timeoutable & CaseMatchable & Shadow>
    ): Chainable<Subject>;
    contains<E extends Node = HTMLElement>(content: number | RegExp | string): Chainable<JQuery<E>>;
    contains<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        text: number | RegExp | string,
        options?: Partial<Loggable & Timeoutable & CaseMatchable & Shadow>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    contains<E extends Node = HTMLElement>(
        selector: string,
        text: number | RegExp | string,
        options?: Partial<Loggable & Timeoutable & CaseMatchable & Shadow>
    ): Chainable<JQuery<E>>;
    dblclick(options?: Partial<ClickOptions>): Chainable<Subject>;
    dblclick(position: PositionType, options?: Partial<ClickOptions>): Chainable<Subject>;
    dblclick(x: number, y: number, options?: Partial<ClickOptions>): Chainable<Subject>;
    debug(options?: Partial<Loggable>): Chainable<Subject>;
    document(options?: Partial<Loggable & Timeoutable>): Chainable<Document>;
    each<E extends Node = HTMLElement>(
        fn: (element: JQuery<E>, index: number, $list: E[]) => void
    ): Chainable<JQuery<E>>;
    each(fn: (item: any, index: number, $list: any[]) => void): Chainable<Subject>;
    end(): Chainable<null>;
    eq<E extends Node = HTMLElement>(
        index: number,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    exec(command: string, options?: Partial<ExecOptions>): Chainable<Exec>;
    filter<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    filter<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    filter<E extends Node = HTMLElement>(
        fn: (index: number, element: E) => boolean,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    find<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable & Shadow>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    find<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Shadow>
    ): Chainable<JQuery<E>>;
    first(options?: Partial<Loggable & Timeoutable>): Chainable<Subject>;
    fixture<Contents = any>(path: string, options?: Partial<Timeoutable>): Chainable<Contents>;
    fixture<Contents = any>(
        path: string,
        encoding: Encodings,
        options?: Partial<Timeoutable>
    ): Chainable<Contents>;
    focus(options?: Partial<Loggable & Timeoutable>): Chainable<Subject>;
    focused(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery>;
    get<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    get<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<JQuery<E>>;
    get<S = any>(
        alias: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;
    getAllCookies(options?: Partial<Loggable & Timeoutable>): Chainable<Cookie[]>;
    getAllLocalStorage(options?: Partial<Loggable>): Chainable<StorageByOrigin>;
    getAllSessionStorage(options?: Partial<Loggable>): Chainable<StorageByOrigin>;
    getCookie(name: string, options?: CookieOptions): Chainable<Cookie | null>;
    getCookies(options?: CookieOptions): Chainable<Cookie[]>;
    go(
        direction: HistoryDirection | number,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<AUTWindow>;
    hash(options?: Partial<Loggable & Timeoutable>): Chainable<string>;
    invoke<
        K extends keyof Subject,
        F extends ((...args: any[]) => any) & Subject[K],
        R = ReturnType<F>,
    >(
        functionName: K,
        ...args: any[]
    ): Chainable<R>;
    invoke<
        K extends keyof Subject,
        F extends ((...args: any[]) => any) & Subject[K],
        R = ReturnType<F>,
    >(
        options: Partial<Loggable & Timeoutable>,
        functionName: K,
        ...args: any[]
    ): Chainable<R>;
    invoke<T extends (...args: any[]) => any>(index: number): Chainable<ReturnType<T>>;
    invoke<T extends (...args: any[]) => any>(
        options: Partial<Loggable & Timeoutable>,
        index: number
    ): Chainable<ReturnType<T>>;
    invoke(propertyPath: string, ...args: any[]): Chainable;
    its<K extends keyof Subject>(
        propertyName: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<NonNullable<Subject[K]>>;
    its(propertyPath: string, options?: Partial<Loggable & Timeoutable>): Chainable;
    its<T>(index: number, options?: Partial<Loggable & Timeoutable>): Chainable<T>;
    last<E extends Node = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    location(options?: Partial<Loggable & Timeoutable>): Chainable<Location>;
    location<K extends keyof Location>(
        key: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<Location[K]>;
    log(message: string, ...args: any[]): Chainable<null>;
    next<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    next<E extends Node = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    next<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    nextAll<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    nextAll<E extends HTMLElement = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    nextAll<E extends HTMLElement = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    nextUntil<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    nextUntil<E extends Node = HTMLElement>(
        selector: string,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    nextUntil<E extends Node = HTMLElement>(
        element: E | JQuery<E>,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    not(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery>;
    now(name: string, ...args: any[]): ((subject: any) => any) | Promise<any>;
    off: Actions;
    on: Actions;
    once: Actions;
    origin<T>(urlOrDomain: string, fn: () => void): Chainable<T>;
    origin<T, S>(
        urlOrDomain: string,
        options: {
            args: T;
        },
        fn: (args: T) => void
    ): Chainable<S>;
    parent<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    parent<E extends Node = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    parent<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    parents<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    parents<E extends Node = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    parents<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    parentsUntil<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    parentsUntil<E extends Node = HTMLElement>(
        selector: string,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    parentsUntil<E extends Node = HTMLElement>(
        element: E | JQuery<E>,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    pause(options?: Partial<Loggable>): Chainable<Subject>;
    prev<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    prev<E extends Node = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    prev<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    prevAll<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    prevAll<E extends Node = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    prevAll<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    prevUntil<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    prevUntil<E extends Node = HTMLElement>(
        selector: string,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    prevUntil<E extends Node = HTMLElement>(
        element: E | JQuery<E>,
        filter?: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    readFile<Contents = any>(
        filePath: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<Contents>;
    readFile<Contents = any>(
        filePath: string,
        encoding: Encodings,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<Contents>;
    reload(): Chainable<AUTWindow>;
    reload(options: Partial<Loggable & Timeoutable>): Chainable<AUTWindow>;
    reload(forceReload: boolean): Chainable<AUTWindow>;
    reload(forceReload: boolean, options: Partial<Loggable & Timeoutable>): Chainable<AUTWindow>;
    request<T = any>(url: string, body?: RequestBody): Chainable<Response<T>>;
    request<T = any>(method: HttpMethod, url: string, body?: RequestBody): Chainable<Response<T>>;
    request<T = any>(options: Partial<RequestOptions>): Chainable<Response<T>>;
    rightclick(options?: Partial<ClickOptions>): Chainable<Subject>;
    rightclick(position: PositionType, options?: Partial<ClickOptions>): Chainable<Subject>;
    rightclick(x: number, y: number, options?: Partial<ClickOptions>): Chainable<Subject>;
    root<E extends Node = HTMLHtmlElement>(options?: Partial<Loggable>): Chainable<JQuery<E>>;
    screenshot(options?: Partial<Loggable & Timeoutable & ScreenshotOptions>): Chainable<Subject>;
    screenshot(
        fileName: string,
        options?: Partial<Loggable & Timeoutable & ScreenshotOptions>
    ): Chainable<Subject>;
    scrollIntoView(options?: Partial<ScrollIntoViewOptions>): Chainable<Subject>;
    scrollTo(position: PositionType, options?: Partial<ScrollToOptions>): Chainable<Subject>;
    scrollTo(
        x: number | string,
        y: number | string,
        options?: Partial<ScrollToOptions>
    ): Chainable<Subject>;
    select(
        valueOrTextOrIndex: (number | string)[] | number | string,
        options?: Partial<SelectOptions>
    ): Chainable<Subject>;
    selectFile(
        files: FileReference | FileReference[],
        options?: Partial<SelectFileOptions>
    ): Chainable<Subject>;
    session(id: object | string, setup: () => void, options?: SessionOptions): Chainable<null>;
    setCookie(name: string, value: string, options?: Partial<SetCookieOptions>): Chainable<Cookie>;
    shadow(): Chainable<Subject>;
    should: Chainer<Subject>;
    siblings<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    siblings<E extends Node = HTMLElement>(
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    siblings<E extends Node = HTMLElement>(
        selector: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    spread<S extends any[] | boolean | number | object | string>(
        fn: (...args: any[]) => S
    ): Chainable<S>;
    spread(fn: (...args: any[]) => void): Chainable<Subject>;
    spy(): Agent<sinon.SinonSpy>;
    spy(func: (...args: any[]) => any): Agent<sinon.SinonSpy>;
    spy<T>(obj: T, method: keyof T): Agent<sinon.SinonSpy>;
    stub(): Agent<sinon.SinonStub>;
    stub(obj: any): Agent<sinon.SinonStub>;
    stub<T>(obj: T, method: keyof T): Agent<sinon.SinonStub>;
    stub<T>(obj: T, method: keyof T, func: (...args: any[]) => any): Agent<sinon.SinonStub>;
    submit(options?: Partial<Loggable & Timeoutable>): Chainable<Subject>;
    task<S = unknown>(
        event: string,
        arg?: any,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<S>;
    then<S>(fn: (this: ObjectLike, currentSubject: Subject) => Chainable<S>): Chainable<S>;
    then<S>(
        options: Partial<Timeoutable>,
        fn: (this: ObjectLike, currentSubject: Subject) => Chainable<S>
    ): Chainable<S>;
    then<S>(fn: (this: ObjectLike, currentSubject: Subject) => PromiseLike<S>): Chainable<S>;
    then<S>(
        options: Partial<Timeoutable>,
        fn: (this: ObjectLike, currentSubject: Subject) => PromiseLike<S>
    ): Chainable<S>;
    then<S extends boolean | number | string>(
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<S>;
    then<S extends HTMLElement>(
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<JQuery<S>>;
    then<S extends ArrayLike<HTMLElement>>(
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<JQuery<S extends ArrayLike<infer T> ? T : never>>;
    then<S extends any[] | object>(
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<S>;
    then<S>(fn: (this: ObjectLike, currentSubject: Subject) => S): ThenReturn<Subject, S>;
    then<S extends HTMLElement>(
        options: Partial<Timeoutable>,
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<JQuery<S>>;
    then<S extends ArrayLike<HTMLElement>>(
        options: Partial<Timeoutable>,
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<JQuery<S extends ArrayLike<infer T> ? T : never>>;
    then<S extends any[] | boolean | number | object | string>(
        options: Partial<Timeoutable>,
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<S>;
    then<S>(
        options: Partial<Timeoutable>,
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): ThenReturn<Subject, S>;
    then(fn: (this: ObjectLike, currentSubject: Subject) => void): Chainable<Subject>;
    then(
        options: Partial<Timeoutable>,
        fn: (this: ObjectLike, currentSubject: Subject) => void
    ): Chainable<Subject>;
    tick(milliseconds: number, options?: Partial<Loggable>): Chainable<Clock>;
    title(options?: Partial<Loggable & Timeoutable>): Chainable<string>;
    trigger<K extends keyof DocumentEventMap>(
        eventName: K,
        options?: Partial<TriggerOptions & ObjectLike & DocumentEventMap[K]>
    ): Chainable<Subject>;
    trigger<K extends keyof DocumentEventMap>(
        eventName: K,
        position?: PositionType,
        options?: Partial<TriggerOptions & ObjectLike & DocumentEventMap[K]>
    ): Chainable<Subject>;
    trigger<K extends keyof DocumentEventMap>(
        eventName: K,
        x: number,
        y: number,
        options?: Partial<TriggerOptions & ObjectLike & DocumentEventMap[K]>
    ): Chainable<Subject>;
    trigger(
        eventName: string,
        position?: PositionType,
        options?: Partial<TriggerOptions & ObjectLike>
    ): Chainable<Subject>;
    trigger(eventName: string, options?: Partial<TriggerOptions & ObjectLike>): Chainable<Subject>;
    trigger(
        eventName: string,
        x: number,
        y: number,
        options?: Partial<TriggerOptions & ObjectLike>
    ): Chainable<Subject>;
    type(text: string, options?: Partial<TypeOptions>): Chainable<Subject>;
    uncheck(options?: Partial<CheckOptions>): Chainable<Subject>;
    uncheck(value: string, options?: Partial<CheckOptions>): Chainable<Subject>;
    uncheck(values: string[], options?: Partial<CheckOptions>): Chainable<Subject>;
    url(options?: Partial<UrlOptions>): Chainable<string>;
    viewport(
        preset: ViewportPreset,
        orientation?: ViewportOrientation,
        options?: Partial<Loggable>
    ): Chainable<null>;
    viewport(width: number, height: number, options?: Partial<Loggable>): Chainable<null>;
    visit(url: string, options?: Partial<VisitOptions>): Chainable<AUTWindow>;
    visit(options: Partial<VisitOptions> & { url: string }): Chainable<AUTWindow>;
    wait(ms: number, options?: Partial<Loggable & Timeoutable>): Chainable<Subject>;
    window(options?: Partial<Loggable & Timeoutable>): Chainable<AUTWindow>;
    within(fn: (currentSubject: Subject) => void): Chainable<Subject>;
    within(options: Partial<Loggable>, fn: (currentSubject: Subject) => void): Chainable<Subject>;
    wrap<E extends Node = HTMLElement>(
        element: E | JQuery<E>,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<JQuery<E>>;
    wrap<S>(promise: Promise<S>, options?: Partial<Loggable & Timeoutable>): Chainable<S>;
    wrap<S>(object: S, options?: Partial<Loggable & Timeoutable>): Chainable<S>;
    writeFile(filePath: string, contents: FileContents, encoding: Encodings): Chainable<null>;
    writeFile(
        filePath: string,
        contents: FileContents,
        options?: Partial<WriteFileOptions & Timeoutable>
    ): Chainable<null>;
    writeFile(
        filePath: string,
        contents: FileContents,
        encoding: Encodings,
        options?: Partial<WriteFileOptions & Timeoutable>
    ): Chainable<null>;
}
export type ChainableMethods<Subject = any> = {
    [P in keyof Chainable<Subject>]: Chainable<Subject>[P] extends (...args: any[]) => any
        ? Chainable<Subject>[P]
        : never;
};
export interface SinonSpyAgent<A extends sinon.SinonSpy> {
    as(alias: string): Omit<A, "withArgs"> & Agent<A>;
    log(shouldOutput?: boolean): Omit<A, "withArgs"> & Agent<A>;
    withArgs(...args: any[]): Omit<A, "withArgs"> & Agent<A>;
}
export type Agent<T extends sinon.SinonSpy> = SinonSpyAgent<T> & T;
export interface Failable {
    failOnStatusCode: boolean;
    retryOnNetworkFailure: boolean;
    retryOnStatusCodeFailure: boolean;
}
export interface Withinable {
    withinSubject: HTMLElement | JQuery | null;
}
export interface Shadow {
    includeShadowDom: boolean;
}
export interface Loggable {
    log: boolean;
}
export interface Timeoutable {
    timeout: number;
}
export interface CaseMatchable {
    matchCase: boolean;
}
export interface TimeoutableXHR {
    requestTimeout: number;
    responseTimeout: number;
}
export interface Forceable {
    force: boolean;
}
export type experimentalCspAllowedDirectives =
    | "child-src"
    | "default-src"
    | "form-action"
    | "frame-src"
    | "script-src-elem"
    | "script-src";
export type scrollBehaviorOptions = "bottom" | "center" | "nearest" | "top" | false;
export interface ActionableOptions extends Forceable {
    animationDistanceThreshold: number;
    scrollBehavior: scrollBehaviorOptions;
    waitForAnimations: boolean;
}
export interface AsOptions {
    type: "query" | "static";
}
export interface BlurOptions extends Loggable, Timeoutable, Forceable {}
export interface CheckOptions extends Loggable, Timeoutable, ActionableOptions {
    interval: number;
}
export interface ClearOptions extends Loggable, Timeoutable, ActionableOptions {
    interval: number;
}
export interface ClickOptions extends Loggable, Timeoutable, ActionableOptions {
    altKey: boolean;
    cmdKey: boolean;
    commandKey: boolean;
    controlKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    multiple: boolean;
    optionKey: boolean;
    shiftKey: boolean;
}
export interface CookieOptions extends Partial<Loggable & Timeoutable> {
    domain?: string;
}
export interface PEMCert {
    cert: string;
    key: string;
    passphrase?: string;
}
export interface PFXCert {
    passphrase?: string;
    pfx: string;
}
export interface ClientCertificate {
    ca?: string[];
    certs: PEMCert[] | PFXCert[];
    url: string;
}
export type RetryStrategyWithModeSpecs = RetryStrategy & {
    openMode: boolean;
    runMode: boolean;
};
export type RetryStrategy =
    | RetryStrategyDetectFlakeAndPassOnThresholdType
    | RetryStrategyDetectFlakeButAlwaysFailType;
export interface RetryStrategyDetectFlakeAndPassOnThresholdType {
    experimentalOptions?: {
        maxRetries: number;
        passesRequired: number;
    };
    experimentalStrategy: "detect-flake-and-pass-on-threshold";
}
export interface RetryStrategyDetectFlakeButAlwaysFailType {
    experimentalOptions?: {
        maxRetries: number;
        stopIfAnyPassed: boolean;
    };
    experimentalStrategy: "detect-flake-but-always-fail";
}
export type Nullable<T> = null | T;
export interface ResolvedConfigOptions<ComponentDevServerOpts = any> {
    animationDistanceThreshold: number;
    baseUrl: null | string;
    blockHosts: null | string | string[];
    chromeWebSecurity: boolean;
    clientCertificates: ClientCertificate[];
    component: ComponentConfigOptions<ComponentDevServerOpts>;
    defaultBrowser: string;
    defaultCommandTimeout: number;
    downloadsFolder: string;
    e2e: EndToEndConfigOptions;
    env: Record<string, any>;
    excludeSpecPattern: string | string[];
    execTimeout: number;
    experimentalCspAllowList: boolean | experimentalCspAllowedDirectives[];
    experimentalFetchPolyfill: boolean;
    experimentalInteractiveRunEvents: boolean;
    experimentalJustInTimeCompile: boolean;
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
    numTestsKeptInMemory: number;
    pageLoadTimeout: number;
    port: null | number;
    projectId: null | string;
    redirectionLimit: number;
    reporter: string;
    reporterOptions: Record<string, any>;
    requestTimeout: number;
    resolvedNodePath: string;
    resolvedNodeVersion: string;
    responseTimeout: number;
    retries: Nullable<
        | { openMode?: Nullable<number>; runMode?: Nullable<number> }
        | number
        | RetryStrategyWithModeSpecs
    >;
    screenshotOnRunFailure: boolean;
    screenshotsFolder: false | string;
    scrollBehavior: scrollBehaviorOptions;
    setupNodeEvents: (
        on: PluginEvents,
        config: PluginConfigOptions
    ) => PluginConfigOptions | Promise<PluginConfigOptions | undefined> | undefined;
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
    viewportHeight: number;
    viewportWidth: number;
    waitForAnimations: boolean;
    watchForFileChanges: boolean;
}
export interface EndToEndConfigOptions extends Omit<CoreConfigOptions, "indexHtmlFile"> {
    experimentalOriginDependencies?: boolean;
    experimentalRunAllSpecs?: boolean;
}
export interface RuntimeConfigOptions extends Partial<RuntimeServerConfigOptions> {
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
export interface RuntimeServerConfigOptions {
    autoOpen: boolean;
    browser: Browser;
    browserUrl: string;
    clientRoute: string;
    cypressEnv: string;
    hideCommandLog: boolean;
    hideRunnerUi: boolean;
    isNewProject: boolean;
    isTextTerminal: boolean;
    morgan: boolean;
    parentTestsFolder: string;
    parentTestsFolderDisplay: string;
    projectName: string;
    protocolEnabled: boolean;
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
export interface SuiteConfigOverrides
    extends Partial<
            Pick<
                ConfigOptions,
                | "animationDistanceThreshold"
                | "blockHosts"
                | "defaultCommandTimeout"
                | "env"
                | "execTimeout"
                | "includeShadowDom"
                | "numTestsKeptInMemory"
                | "pageLoadTimeout"
                | "redirectionLimit"
                | "requestTimeout"
                | "responseTimeout"
                | "retries"
                | "screenshotOnRunFailure"
                | "scrollBehavior"
                | "slowTestThreshold"
                | "taskTimeout"
                | "viewportHeight"
                | "viewportWidth"
                | "waitForAnimations"
            >
        >,
        Partial<Pick<ResolvedConfigOptions, "baseUrl" | "testIsolation">> {
    browser?: IsBrowserMatcher | IsBrowserMatcher[];
    keystrokeDelay?: number;
}
export interface TestConfigOverrides
    extends Partial<
            Pick<
                ConfigOptions,
                | "animationDistanceThreshold"
                | "blockHosts"
                | "defaultCommandTimeout"
                | "env"
                | "execTimeout"
                | "includeShadowDom"
                | "numTestsKeptInMemory"
                | "pageLoadTimeout"
                | "redirectionLimit"
                | "requestTimeout"
                | "responseTimeout"
                | "retries"
                | "screenshotOnRunFailure"
                | "scrollBehavior"
                | "slowTestThreshold"
                | "taskTimeout"
                | "viewportHeight"
                | "viewportWidth"
                | "waitForAnimations"
            >
        >,
        Partial<Pick<ResolvedConfigOptions, "baseUrl">> {
    browser?: IsBrowserMatcher | IsBrowserMatcher[];
    keystrokeDelay?: number;
}
export type CoreConfigOptions = Partial<Omit<ResolvedConfigOptions, TestingType>>;
export type DefineDevServerConfig = Record<string, any>;
export type PickConfigOpt<T> = T extends keyof DefineDevServerConfig
    ? DefineDevServerConfig[T]
    : any;
export interface DependencyToInstall {
    dependency: CypressComponentDependency;
    detectedVersion: null | string;
    satisfied: boolean;
}
export interface CypressComponentDependency {
    description: string;
    installer: string;
    minVersion: string;
    name: string;
    package: string;
    type: string;
}
export interface ResolvedComponentFrameworkDefinition {
    category: "library" | "template";
    codeGenFramework?: "angular" | "react" | "svelte" | "vue";
    componentIndexHtml?: () => string;
    configFramework: string;
    dependencies: (
        bundler: "vite" | "webpack",
        projectPath: string
    ) => Promise<DependencyToInstall[]>;
    detectors: CypressComponentDependency[];
    glob?: string;
    mountModule: (projectPath: string) => Promise<string>;
    name: string;
    specPattern?: "**/*.cy.ts";
    supportedBundlers: ("vite" | "webpack")[];
    supportStatus: "alpha" | "beta" | "community" | "full";
    type: string;
}
export type ComponentFrameworkDefinition = Omit<
    ResolvedComponentFrameworkDefinition,
    "dependencies"
> & {
    dependencies: (bundler: "vite" | "webpack") => CypressComponentDependency[];
};
export type ThirdPartyComponentFrameworkDefinition = Pick<
    ComponentFrameworkDefinition,
    "dependencies" | "detectors" | "name" | "supportedBundlers" | "type"
> & {
    icon?: string;
    type: string;
};
export interface AngularDevServerProjectConfig {
    buildOptions: Record<string, any>;
    root: string;
    sourceRoot: string;
}
export type DevServerFn<ComponentDevServerOpts = any> = (
    cypressDevServerConfig: DevServerConfig,
    devServerConfig: ComponentDevServerOpts
) => Promise<ResolvedDevServerConfig> | ResolvedDevServerConfig;
export type ConfigHandler<T> = (() => Promise<T> | T) | T;
export type DevServerConfigOptions =
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
export interface ComponentConfigOptions<ComponentDevServerOpts = any>
    extends Omit<CoreConfigOptions, "baseUrl" | "experimentalStudio"> {
    devServer: DevServerConfigOptions | DevServerFn<ComponentDevServerOpts>;
    devServerConfig?: ComponentDevServerOpts;
    experimentalSingleTabRunMode?: boolean;
}
export type UserConfigOptions<ComponentDevServerOpts = any> = Omit<
    ResolvedConfigOptions<ComponentDevServerOpts>,
    "baseUrl" | "excludeSpecPattern" | "indexHtmlFile" | "specPattern" | "supportFile"
>;
export type ConfigOptions<ComponentDevServerOpts = any> = Partial<
    UserConfigOptions<ComponentDevServerOpts>
> & {
    hosts?: null | Record<string, string>;
};
export interface PluginConfigOptions extends ResolvedConfigOptions, RuntimeConfigOptions {
    projectRoot: string;
    testingType: TestingType;
    version: string;
}
export interface DebugOptions {
    verbose: boolean;
}
export interface ExecOptions extends Loggable, Timeoutable {
    env: object;
    failOnNonZeroExit: boolean;
}
export interface KeyboardDefaultsOptions {
    keystrokeDelay: number;
}
export interface RequestOptions extends Loggable, Timeoutable, Failable {
    auth: object;
    body: RequestBody;
    encoding: Encodings;
    followRedirect: boolean;
    form: boolean;
    gzip: boolean;
    headers: object;
    method: HttpMethod;
    qs: object;
    url: string;
}
export interface RouteOptions {
    delay: number;
    force404: boolean;
    headers: null | object;
    method: HttpMethod;
    onAbort(...args: any[]): void;
    onRequest(...args: any[]): void;
    onResponse(...args: any[]): void;
    response: any;
    status: number;
    url: RegExp | string;
}
export interface Dimensions {
    height: number;
    width: number;
    x: number;
    y: number;
}
export type Padding =
    | [number, number, number, number]
    | [number, number, number]
    | [number, number]
    | [number]
    | number;
export interface ScreenshotOptions {
    blackout: string[];
    capture: "fullPage" | "runner" | "viewport";
    clip: Dimensions;
    disableTimersAndAnimations: boolean;
    onAfterScreenshot: (
        $el: JQuery,
        props: {
            blackout: string[];
            dimensions: {
                height: number;
                width: number;
            };
            duration: number;
            multipart: boolean;
            name: string;
            path: string;
            pixelRatio: number;
            size: number;
            takenAt: string;
            testAttemptIndex: number;
        }
    ) => void;
    onBeforeScreenshot: ($el: JQuery) => void;
    overwrite: boolean;
    padding: Padding;
    scale: boolean;
}
export interface ScreenshotDefaultsOptions extends ScreenshotOptions {
    screenshotOnRunFailure: boolean;
}
export interface SelectorPlaygroundDefaultsOptions {
    onElement: ($el: JQuery) => null | string | undefined;
    selectorPriority: string[];
}
export interface ScrollToOptions extends Loggable, Timeoutable {
    duration: number;
    easing: "linear" | "swing";
    ensureScrollable: boolean;
}
export interface ScrollIntoViewOptions extends ScrollToOptions {
    offset: Offset;
}
export interface SelectOptions extends Loggable, Timeoutable, Forceable {
    interval: number;
}
export interface Session {
    clearAllSavedSessions: () => Promise<void>;
    clearCurrentSessionData: () => Promise<void>;
    getCurrentSessionData: () => Promise<SessionData>;
    getSession: (id: string) => Promise<ServerSessionData>;
}
export type ActiveSessions = Record<string, SessionData>;
export interface SessionData {
    cacheAcrossSpecs: SessionOptions["cacheAcrossSpecs"];
    cookies?: Cookie[] | null;
    hydrated: boolean;
    id: string;
    localStorage?: null | OriginStorage[];
    sessionStorage?: null | OriginStorage[];
    setup: () => void;
    validate?: SessionOptions["validate"];
}
export interface ServerSessionData extends Omit<SessionData, "setup" | "validate"> {
    setup: string;
    validate?: string;
}
export interface SessionOptions {
    cacheAcrossSpecs?: boolean;
    validate?: () => Promise<false | undefined> | undefined;
}
export type SameSiteStatus = "lax" | "no_restriction" | "strict";
export interface SelectFileOptions extends Loggable, Timeoutable, ActionableOptions {
    action: "drag-drop" | "select";
}
export interface SetCookieOptions extends Loggable, Timeoutable {
    domain: string;
    expiry: number;
    hostOnly: boolean;
    httpOnly: boolean;
    path: string;
    sameSite: SameSiteStatus;
    secure: boolean;
}
export interface ShadowDomOptions {
    includeShadowDom?: boolean;
}
export interface TypeOptions extends Loggable, Timeoutable, ActionableOptions {
    delay: number;
    parseSpecialCharSequences: boolean;
    release: boolean;
}
export interface VisitOptions extends Loggable, Timeoutable, Failable {
    auth: Auth;
    body: RequestBody;
    headers: Record<string, string>;
    method: "GET" | "POST";
    onBeforeLoad(win: AUTWindow): void;
    onLoad(win: AUTWindow): void;
    qs: object;
    url: string;
}
export interface TriggerOptions extends Loggable, Timeoutable, ActionableOptions {
    bubbles: boolean;
    cancelable: boolean;
    eventConstructor: string;
}
export interface UrlOptions extends Loggable, Timeoutable {
    decode: boolean;
}
export interface WriteFileOptions extends Loggable {
    encoding: Encodings;
    flag: string;
}
export interface Chainer<Subject> {
    (chainer: "be.a", type: string): Chainable<Subject>;
    (chainer: "be.above", value: Date | number): Chainable<Subject>;
    (chainer: "be.an", value: string): Chainable<Subject>;
    (chainer: "be.at.least", value: Date | number): Chainable<Subject>;
    (chainer: "be.below", value: number): Chainable<Subject>;
    (chainer: "be.arguments"): Chainable<Subject>;
    (chainer: "be.approximately", value: number, delta: number): Chainable<Subject>;
    (chainer: "be.closeTo", value: number, delta: number): Chainable<Subject>;
    (chainer: "be.empty"): Chainable<Subject>;
    (chainer: "be.instanceOf", value: any): Chainable<Subject>;
    (chainer: "be.false"): Chainable<Subject>;
    (chainer: "be.greaterThan", value: number): Chainable<Subject>;
    (chainer: "be.gt", value: number): Chainable<Subject>;
    (chainer: "be.gte", value: number): Chainable<Subject>;
    (chainer: "be.lessThan", value: number): Chainable<Subject>;
    (chainer: "be.lt", value: number): Chainable<Subject>;
    (chainer: "be.lte", value: number): Chainable<Subject>;
    (chainer: "be.ok"): Chainable<Subject>;
    (chainer: "be.true"): Chainable<Subject>;
    (chainer: "be.undefined"): Chainable<Subject>;
    (chainer: "be.null"): Chainable<Subject>;
    (chainer: "be.NaN"): Chainable<Subject>;
    (chainer: "be.within", start: number, end: number): Chainable<Subject>;
    (chainer: "be.within", start: Date, end: Date): Chainable<Subject>;
    (chainer: "change", fn: (...args: any[]) => any): Chainable<Subject>;
    (chainer: "change", obj: object, prop: string): Chainable<Subject>;
    (chainer: "contain", value: any): Chainable<Subject>;
    (chainer: "decrease", fn: (...args: any[]) => any): Chainable<Subject>;
    (chainer: "decrease", obj: object, prop: string): Chainable<Subject>;
    (chainer: "deep.equal", value: Subject): Chainable<Subject>;
    (chainer: "exist"): Chainable<Subject>;
    (chainer: "eq", value: any): Chainable<Subject>;
    (chainer: "eql", value: any): Chainable<Subject>;
    (chainer: "equal", value: any): Chainable<Subject>;
    (chainer: "have.all.key", ...value: string[]): Chainable<Subject>;
    (chainer: "have.any.key", ...value: string[]): Chainable<Subject>;
    (
        chainer: "have.all.deep.keys" | "have.all.keys" | "have.deep.keys" | "have.keys",
        ...value: string[]
    ): Chainable<Subject>;
    (chainer: "have.any.keys" | "include.any.keys", ...value: string[]): Chainable<Subject>;
    (chainer: "include.all.keys", ...value: string[]): Chainable<Subject>;
    (chainer: "have.deep.property", value: string, obj: object): Chainable<Subject>;
    (chainer: "have.length" | "have.lengthOf", value: number): Chainable<Subject>;
    (
        chainer: "have.length.greaterThan" | "have.lengthOf.greaterThan",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "have.length.above"
            | "have.length.gt"
            | "have.lengthOf.above"
            | "have.lengthOf.gt",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "have.length.at.least"
            | "have.length.gte"
            | "have.lengthOf.at.least"
            | "have.lengthOf.gte",
        value: number
    ): Chainable<Subject>;
    (chainer: "have.length.lessThan" | "have.lengthOf.lessThan", value: number): Chainable<Subject>;
    (
        chainer:
            | "have.length.below"
            | "have.length.lt"
            | "have.lengthOf.below"
            | "have.lengthOf.lt",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "have.length.at.most"
            | "have.length.lte"
            | "have.lengthOf.at.most"
            | "have.lengthOf.lte",
        value: number
    ): Chainable<Subject>;
    (
        chainer: "have.length.within" | "have.lengthOf.within",
        start: number,
        finish: number
    ): Chainable<Subject>;
    (chainer: "have.deep.members" | "have.members", values: any[]): Chainable<Subject>;
    (chainer: "have.ordered.members", values: any[]): Chainable<Subject>;
    (chainer: "have.ownProperty", property: string): Chainable<Subject>;
    (
        chainer:
            | "have.a.property"
            | "have.deep.nested.property"
            | "have.deep.own.property"
            | "have.deep.property"
            | "have.nested.property"
            | "have.own.property"
            | "have.property",
        property: string,
        value?: any
    ): Chainable<Subject>;
    (
        chainer: "have.ownPropertyDescriptor" | "haveOwnPropertyDescriptor",
        name: string,
        descriptor?: PropertyDescriptor
    ): Chainable<Subject>;
    (chainer: "have.string", match: RegExp | string): Chainable<Subject>;
    (
        chainer:
            | "deep.include"
            | "deep.nested.include"
            | "deep.own.include"
            | "include"
            | "nested.include"
            | "own.include",
        value: any
    ): Chainable<Subject>;
    (
        chainer: "include.deep.ordered.members" | "include.members" | "include.ordered.members",
        value: any[]
    ): Chainable<Subject>;
    (chainer: "increase", value: object, property?: string): Chainable<Subject>;
    (chainer: "match", value: RegExp): Chainable<Subject>;
    (chainer: "respondTo", value: string): Chainable<Subject>;
    (chainer: "satisfy", fn: (val: any) => boolean): Chainable<Subject>;
    (chainer: "throw", value?: RegExp | string): Chainable<Subject>;
    (
        chainer: "throw",
        error: ((...args: unknown[]) => unknown) | Error,
        expected?: RegExp | string
    ): Chainable<Subject>;
    (chainer: "be.oneOf", list: readonly any[]): Chainable<Subject>;
    (chainer: "be.extensible"): Chainable<Subject>;
    (chainer: "be.sealed"): Chainable<Subject>;
    (chainer: "be.frozen"): Chainable<Subject>;
    (chainer: "be.finite"): Chainable<Subject>;
    (chainer: "not.be.a", type: string): Chainable<Subject>;
    (chainer: "not.be.above", value: Date | number): Chainable<Subject>;
    (chainer: "not.be.an", value: string): Chainable<Subject>;
    (chainer: "not.be.at.least", value: Date | number): Chainable<Subject>;
    (chainer: "not.be.below", value: number): Chainable<Subject>;
    (chainer: "not.be.arguments"): Chainable<Subject>;
    (chainer: "not.be.approximately", value: number, delta: number): Chainable<Subject>;
    (chainer: "not.be.closeTo", value: number, delta: number): Chainable<Subject>;
    (chainer: "not.be.empty"): Chainable<Subject>;
    (chainer: "not.be.instanceOf", value: any): Chainable<Subject>;
    (chainer: "not.be.false"): Chainable<Subject>;
    (chainer: "not.be.greaterThan", value: number): Chainable<Subject>;
    (chainer: "not.be.gt", value: number): Chainable<Subject>;
    (chainer: "not.be.gte", value: number): Chainable<Subject>;
    (chainer: "not.be.lessThan", value: number): Chainable<Subject>;
    (chainer: "not.be.lt", value: number): Chainable<Subject>;
    (chainer: "not.be.lte", value: number): Chainable<Subject>;
    (chainer: "not.be.ok"): Chainable<Subject>;
    (chainer: "not.be.true"): Chainable<Subject>;
    (chainer: "not.be.undefined"): Chainable<Subject>;
    (chainer: "not.be.null"): Chainable<Subject>;
    (chainer: "not.be.NaN"): Chainable<Subject>;
    (chainer: "not.be.within", start: number, end: number): Chainable<Subject>;
    (chainer: "not.be.within", start: Date, end: Date): Chainable<Subject>;
    (chainer: "not.change", fn: (...args: any[]) => any): Chainable<Subject>;
    (chainer: "not.change", obj: object, prop: string): Chainable<Subject>;
    (chainer: "not.contain", value: any): Chainable<Subject>;
    (chainer: "not.decrease", fn: (...args: any[]) => any): Chainable<Subject>;
    (chainer: "not.decrease", obj: object, prop: string): Chainable<Subject>;
    (chainer: "not.deep.equal", value: Subject): Chainable<Subject>;
    (chainer: "not.exist"): Chainable<Subject>;
    (chainer: "not.eq", value: any): Chainable<Subject>;
    (chainer: "not.eql", value: any): Chainable<Subject>;
    (chainer: "not.equal", value: any): Chainable<Subject>;
    (
        chainer:
            | "not.have.all.deep.keys"
            | "not.have.all.keys"
            | "not.have.deep.keys"
            | "not.have.keys",
        ...value: string[]
    ): Chainable<Subject>;
    (chainer: "not.have.any.keys" | "not.include.any.keys", ...value: string[]): Chainable<Subject>;
    (chainer: "not.have.deep.property", value: string, obj: object): Chainable<Subject>;
    (chainer: "not.have.length" | "not.have.lengthOf", value: number): Chainable<Subject>;
    (
        chainer: "not.have.length.greaterThan" | "not.have.lengthOf.greaterThan",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "not.have.length.above"
            | "not.have.length.gt"
            | "not.have.lengthOf.above"
            | "not.have.lengthOf.gt",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "not.have.length.at.least"
            | "not.have.length.gte"
            | "not.have.lengthOf.at.least"
            | "not.have.lengthOf.gte",
        value: number
    ): Chainable<Subject>;
    (
        chainer: "not.have.length.lessThan" | "not.have.lengthOf.lessThan",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "not.have.length.below"
            | "not.have.length.lt"
            | "not.have.lengthOf.below"
            | "not.have.lengthOf.lt",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "not.have.length.at.most"
            | "not.have.length.lte"
            | "not.have.lengthOf.at.most"
            | "not.have.lengthOf.lte",
        value: number
    ): Chainable<Subject>;
    (
        chainer: "not.have.length.within" | "not.have.lengthOf.within",
        start: number,
        finish: number
    ): Chainable<Subject>;
    (chainer: "not.have.deep.members" | "not.have.members", values: any[]): Chainable<Subject>;
    (chainer: "not.have.ordered.members", values: any[]): Chainable<Subject>;
    (chainer: "not.have.ownProperty", property: string): Chainable<Subject>;
    (
        chainer:
            | "not.have.a.property"
            | "not.have.deep.nested.property"
            | "not.have.deep.own.property"
            | "not.have.deep.property"
            | "not.have.nested.property"
            | "not.have.own.property"
            | "not.have.property",
        property: string,
        value?: any
    ): Chainable<Subject>;
    (
        chainer: "not.have.ownPropertyDescriptor" | "not.haveOwnPropertyDescriptor",
        name: string,
        descriptor?: PropertyDescriptor
    ): Chainable<Subject>;
    (chainer: "not.have.string", match: RegExp | string): Chainable<Subject>;
    (
        chainer:
            | "not.deep.include"
            | "not.deep.nested.include"
            | "not.deep.own.include"
            | "not.include"
            | "not.nested.include"
            | "not.own.include",
        value: any
    ): Chainable<Subject>;
    (
        chainer:
            | "not.include.deep.ordered.members"
            | "not.include.members"
            | "not.include.ordered.members",
        value: any[]
    ): Chainable<Subject>;
    (chainer: "not.increase", value: object, property?: string): Chainable<Subject>;
    (chainer: "not.match", value: RegExp): Chainable<Subject>;
    (chainer: "not.respondTo", value: string): Chainable<Subject>;
    (chainer: "not.satisfy", fn: (val: any) => boolean): Chainable<Subject>;
    (chainer: "not.throw", value?: RegExp | string): Chainable<Subject>;
    (
        chainer: "not.throw",
        error: ((...args: unknown[]) => unknown) | Error,
        expected?: RegExp | string
    ): Chainable<Subject>;
    (chainer: "not.be.oneOf", list: readonly any[]): Chainable<Subject>;
    (chainer: "not.be.extensible"): Chainable<Subject>;
    (chainer: "not.be.sealed"): Chainable<Subject>;
    (chainer: "not.be.frozen"): Chainable<Subject>;
    (chainer: "not.be.finite"): Chainable<Subject>;
    (chainer: "always.have.been.calledWithNew" | "be.always.calledWithNew"): Chainable<Subject>;
    (
        chainer: "always.have.been.calledWithMatch" | "be.always.calledWithMatch",
        ...args: any[]
    ): Chainable<Subject>;
    (chainer: "always.returned" | "have.always.returned", value: any): Chainable<Subject>;
    (chainer: "be.called" | "have.been.called"): Chainable<Subject>;
    (chainer: "be.calledAfter" | "have.been.calledAfter", spy: sinon.SinonSpy): Chainable<Subject>;
    (
        chainer: "be.calledBefore" | "have.been.calledBefore",
        spy: sinon.SinonSpy
    ): Chainable<Subject>;
    (chainer: "be.calledOn" | "have.been.calledOn", context: any): Chainable<Subject>;
    (chainer: "be.calledOnce" | "have.been.calledOnce"): Chainable<Subject>;
    (chainer: "be.calledThrice" | "have.been.calledThrice"): Chainable<Subject>;
    (chainer: "be.calledTwice" | "have.been.calledTwice"): Chainable<Subject>;
    (
        chainer: "be.calledWithExactly" | "have.been.calledWithExactly",
        ...args: any[]
    ): Chainable<Subject>;
    (
        chainer: "be.calledWithMatch" | "have.been.calledWithMatch",
        ...args: any[]
    ): Chainable<Subject>;
    (chainer: "be.calledWithNew" | "have.been.calledWithNew"): Chainable<Subject>;
    (chainer: "have.always.thrown", value?: Error | string | typeof Error): Chainable<Subject>;
    (chainer: "have.callCount", value: number): Chainable<Subject>;
    (chainer: "have.thrown", value?: Error | string | typeof Error): Chainable<Subject>;
    (chainer: "have.returned" | "returned", value: any): Chainable<Subject>;
    (
        chainer: "be.calledImmediatelyBefore" | "have.been.calledImmediatelyBefore",
        anotherSpy: sinon.SinonSpy
    ): Chainable<Subject>;
    (
        chainer: "be.calledImmediatelyAfter" | "have.been.calledImmediatelyAfter",
        anotherSpy: sinon.SinonSpy
    ): Chainable<Subject>;
    (chainer: "always.have.been.calledOn" | "be.always.calledOn", obj: any): Chainable<Subject>;
    (chainer: "be.calledWith" | "have.been.calledWith", ...args: any[]): Chainable<Subject>;
    (
        chainer: "always.have.been.calledWith" | "be.always.calledWith",
        ...args: any[]
    ): Chainable<Subject>;
    (chainer: "be.calledOnceWith" | "have.been.calledOnceWith", ...args: any[]): Chainable<Subject>;
    (
        chainer: "be.always.calledWithExactly" | "have.been.calledWithExactly",
        ...args: any[]
    ): Chainable<Subject>;
    (
        chainer: "be.calledOnceWithExactly" | "have.been.calledOnceWithExactly",
        ...args: any[]
    ): Chainable<Subject>;
    (chainer: "have.always.returned", obj: any): Chainable<Subject>;
    (
        chainer: "not.always.have.been.calledWithNew" | "not.be.always.calledWithNew"
    ): Chainable<Subject>;
    (
        chainer: "not.always.have.been.calledWithMatch" | "not.be.always.calledWithMatch",
        ...args: any[]
    ): Chainable<Subject>;
    (chainer: "not.always.returned" | "not.have.always.returned", value: any): Chainable<Subject>;
    (chainer: "not.be.called" | "not.have.been.called"): Chainable<Subject>;
    (
        chainer: "not.be.calledAfter" | "not.have.been.calledAfter",
        spy: sinon.SinonSpy
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledBefore" | "not.have.been.calledBefore",
        spy: sinon.SinonSpy
    ): Chainable<Subject>;
    (chainer: "not.be.calledOn" | "not.have.been.calledOn", context: any): Chainable<Subject>;
    (chainer: "not.be.calledOnce" | "not.have.been.calledOnce"): Chainable<Subject>;
    (chainer: "not.be.calledThrice" | "not.have.been.calledThrice"): Chainable<Subject>;
    (chainer: "not.be.calledTwice" | "not.have.been.calledTwice"): Chainable<Subject>;
    (
        chainer: "not.be.calledWithExactly" | "not.have.been.calledWithExactly",
        ...args: any[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledWithMatch" | "not.have.been.calledWithMatch",
        ...args: any[]
    ): Chainable<Subject>;
    (chainer: "not.be.calledWithNew" | "not.have.been.calledWithNew"): Chainable<Subject>;
    (chainer: "not.have.always.thrown", value?: Error | string | typeof Error): Chainable<Subject>;
    (chainer: "not.have.callCount", value: number): Chainable<Subject>;
    (chainer: "not.have.thrown", value?: Error | string | typeof Error): Chainable<Subject>;
    (chainer: "not.have.returned" | "not.returned", value: any): Chainable<Subject>;
    (
        chainer: "not.be.calledImmediatelyBefore" | "not.have.been.calledImmediatelyBefore",
        anotherSpy: sinon.SinonSpy
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledImmediatelyAfter" | "not.have.been.calledImmediatelyAfter",
        anotherSpy: sinon.SinonSpy
    ): Chainable<Subject>;
    (
        chainer: "not.always.have.been.calledOn" | "not.be.always.calledOn",
        obj: any
    ): Chainable<Subject>;
    (chainer: "not.be.calledWith" | "not.have.been.calledWith", ...args: any[]): Chainable<Subject>;
    (
        chainer: "not.always.have.been.calledWith" | "not.be.always.calledWith",
        ...args: any[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledOnceWith" | "not.have.been.calledOnceWith",
        ...args: any[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.always.calledWithExactly" | "not.have.been.calledWithExactly",
        ...args: any[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledOnceWithExactly" | "not.have.been.calledOnceWithExactly",
        ...args: any[]
    ): Chainable<Subject>;
    (chainer: "not.have.always.returned", obj: any): Chainable<Subject>;
    (chainer: "be.checked"): Chainable<Subject>;
    (chainer: "be.disabled"): Chainable<Subject>;
    (chainer: "be.empty"): Chainable<Subject>;
    (chainer: "be.enabled"): Chainable<Subject>;
    (chainer: "be.hidden"): Chainable<Subject>;
    (chainer: "be.selected"): Chainable<Subject>;
    (chainer: "be.visible"): Chainable<Subject>;
    (chainer: "contain", value: string): Chainable<Subject>;
    (chainer: "have.focus"): Chainable<Subject>;
    (chainer: "be.focused"): Chainable<Subject>;
    (chainer: "exist"): Chainable<Subject>;
    (chainer: "have.attr", value: string, match?: string): Chainable<Subject>;
    (chainer: "have.class", value: string): Chainable<Subject>;
    (chainer: "have.css", value: string, match?: string): Chainable<Subject>;
    (chainer: "have.data", value: string, match?: string): Chainable<Subject>;
    (chainer: "have.descendants", selector: string): Chainable<Subject>;
    (chainer: "have.html", value: string): Chainable<Subject>;
    (chainer: "contain.html", value: string): Chainable<Subject>;
    (chainer: "include.html", value: string): Chainable<Subject>;
    (chainer: "have.id", value: string, match?: string): Chainable<Subject>;
    (chainer: "have.prop", value: string, match?: any): Chainable<Subject>;
    (chainer: "have.text", value: string): Chainable<Subject>;
    (chainer: "contain.text", value: string): Chainable<Subject>;
    (chainer: "include.text", value: string): Chainable<Subject>;
    (chainer: "have.value", value: string): Chainable<Subject>;
    (chainer: "contain.value", value: string): Chainable<Subject>;
    (chainer: "include.value", value: string): Chainable<Subject>;
    (chainer: "match", value: string): Chainable<Subject>;
    (chainer: "not.be.checked"): Chainable<Subject>;
    (chainer: "not.be.disabled"): Chainable<Subject>;
    (chainer: "not.be.empty"): Chainable<Subject>;
    (chainer: "not.be.enabled"): Chainable<Subject>;
    (chainer: "not.be.hidden"): Chainable<Subject>;
    (chainer: "not.be.selected"): Chainable<Subject>;
    (chainer: "not.be.visible"): Chainable<Subject>;
    (chainer: "not.have.focus"): Chainable<Subject>;
    (chainer: "not.be.focused"): Chainable<Subject>;
    (chainer: "not.contain", value: string): Chainable<Subject>;
    (chainer: "not.exist"): Chainable<Subject>;
    (chainer: "not.have.attr", value: string, match?: string): Chainable<Subject>;
    (chainer: "not.have.class", value: string): Chainable<Subject>;
    (chainer: "not.have.css", value: string, match?: string): Chainable<Subject>;
    (chainer: "not.have.data", value: string, match?: string): Chainable<Subject>;
    (chainer: "not.have.descendants", selector: string): Chainable<Subject>;
    (chainer: "not.have.html", value: string): Chainable<Subject>;
    (chainer: "not.contain.html", value: string): Chainable<Subject>;
    (chainer: "not.include.html", value: string): Chainable<Subject>;
    (chainer: "not.have.id", value: string, match?: string): Chainable<Subject>;
    (chainer: "not.have.prop", value: string, match?: any): Chainable<Subject>;
    (chainer: "not.have.text", value: string): Chainable<Subject>;
    (chainer: "not.contain.text", value: string): Chainable<Subject>;
    (chainer: "not.include.text", value: string): Chainable<Subject>;
    (chainer: "not.have.value", value: string): Chainable<Subject>;
    (chainer: "not.contain.value", value: string): Chainable<Subject>;
    (chainer: "not.include.value", value: string): Chainable<Subject>;
    (chainer: "not.match", value: string): Chainable<Subject>;
    (chainers: string, value?: any): Chainable<Subject>;
    (chainers: string, value: any, match: any): Chainable<Subject>;
    (fn: (currentSubject: Subject) => void): Chainable<Subject>;
}
export interface AfterBrowserLaunchDetails {
    webSocketDebuggerUrl: string;
}
export interface BeforeBrowserLaunchOptions {
    args: string[];
    env: Record<string, any>;
    extensions: string[];
    preferences: Record<string, any>;
}
export interface Dimensions {
    height: number;
    width: number;
}
export interface ScreenshotDetails {
    blackout: string[];
    dimensions: Dimensions;
    duration: number;
    multipart: boolean;
    name: string;
    path: string;
    pixelRatio: number;
    scaled: boolean;
    size: number;
    specName: string;
    takenAt: string;
    testFailure: boolean;
}
export interface AfterScreenshotReturnObject {
    dimensions?: Dimensions;
    path?: string;
    size?: number;
}
export interface FileObject extends NodeEventEmitter {
    filePath: string;
    outputPath: string;
    shouldWatch: boolean;
}
export type Task = (value: any) => any;
export type Tasks = Record<string, Task>;
export interface SystemDetails {
    osName: string;
    osVersion: string;
}
export interface BeforeRunDetails {
    autoCancelAfterFailures?: false | number;
    browser?: Browser;
    config: ConfigOptions;
    cypressVersion: string;
    group?: string;
    parallel?: boolean;
    runUrl?: string;
    specPattern?: string[];
    specs?: Spec[];
    system: SystemDetails;
    tag?: string;
}
export interface DevServerConfig {
    cypressConfig: PluginConfigOptions;
    devServerEvents: NodeJS.EventEmitter;
    specs: Spec[];
}
export interface ResolvedDevServerConfig {
    close: (done?: (err?: Error) => any) => void;
    port: number;
}
export interface PluginEvents {
    (
        action: "after:browser:launch",
        fn: (
            browser: Browser,
            browserLaunchDetails: AfterBrowserLaunchDetails
        ) => Promise<void> | undefined
    ): void;
    (
        action: "after:run",
        fn: (results: CypressFailedRunResult | CypressRunResult) => Promise<void> | undefined
    ): void;
    (
        action: "after:screenshot",
        fn: (
            details: ScreenshotDetails
        ) => AfterScreenshotReturnObject | Promise<AfterScreenshotReturnObject> | undefined
    ): void;
    (action: "after:spec", fn: (spec: Spec, results: RunResult) => Promise<void> | undefined): void;
    (action: "before:run", fn: (runDetails: BeforeRunDetails) => Promise<void> | undefined): void;
    (action: "before:spec", fn: (spec: Spec) => Promise<void> | undefined): void;
    (
        action: "before:browser:launch",
        fn: (
            browser: Browser,
            afterBrowserLaunchOptions: BeforeBrowserLaunchOptions
        ) =>
            | BeforeBrowserLaunchOptions
            | Promise<BeforeBrowserLaunchOptions>
            | Promise<void>
            | undefined
    ): void;
    (action: "file:preprocessor", fn: (file: FileObject) => Promise<string> | string): void;
    (
        action: "dev-server:start",
        fn: (file: DevServerConfig) => Promise<ResolvedDevServerConfig>
    ): void;
    (action: "task", tasks: Tasks): void;
}
export interface CodeFrame {
    absoluteFile: string;
    column: number;
    frame: string;
    language: string;
    line: number;
    originalFile: string;
    relativeFile: string;
}
export interface CypressError extends Error {
    codeFrame?: CodeFrame;
    docsUrl?: string;
}
export interface Actions {
    (
        action: "uncaught:exception",
        fn: (error: Error, runnable: Mocha.Runnable, promise?: Promise<any>) => false | undefined
    ): Cypress;
    (
        action: "window:confirm",
        fn:
            | ((text: string) => false | undefined)
            | SinonSpyAgent<sinon.SinonSpy>
            | SinonSpyAgent<sinon.SinonStub>
    ): Cypress;
    (
        action: "window:alert",
        fn:
            | ((text: string) => void)
            | SinonSpyAgent<sinon.SinonSpy>
            | SinonSpyAgent<sinon.SinonStub>
    ): Cypress;
    (action: "window:before:load", fn: (win: AUTWindow) => void): Cypress;
    (action: "window:load", fn: (win: AUTWindow) => void): Cypress;
    (action: "window:before:unload", fn: (event: BeforeUnloadEvent) => void): Cypress;
    (action: "window:unload", fn: (event: Event) => void): Cypress;
    (action: "url:changed", fn: (url: string) => void): Cypress;
    (action: "fail", fn: (error: CypressError, mocha: Mocha.Runnable) => void): Cypress;
    (action: "viewport:changed", fn: (viewport: Viewport) => void): Cypress;
    (action: "scrolled", fn: ($el: JQuery) => void): Cypress;
    (action: "command:enqueued", fn: (command: EnqueuedCommandAttributes) => void): Cypress;
    (action: "command:start", fn: (command: CommandQueue) => void): Cypress;
    (action: "command:end", fn: (command: CommandQueue) => void): Cypress;
    (action: "skipped:command:end", fn: (command: CommandQueue) => void): Cypress;
    (action: "command:retry", fn: (command: CommandQueue) => void): Cypress;
    (action: "log:added", fn: (attributes: ObjectLike, log: any) => void): Cypress;
    (action: "log:changed", fn: (attributes: ObjectLike, log: any) => void): Cypress;
    (action: "test:before:run", fn: (attributes: ObjectLike, test: Mocha.Test) => void): Cypress;
    (
        action: "test:before:run:async",
        fn: (attributes: ObjectLike, test: Mocha.Test) => Promise<any> | undefined
    ): Cypress;
    (action: "test:after:run", fn: (attributes: ObjectLike, test: Mocha.Test) => void): Cypress;
}
export interface CommandQueue extends ObjectLike {
    add(obj: any): any;
    create(): CommandQueue;
    get(): any;
    get(key: string): CommandQueue[keyof CommandQueue];
    logs(filters: any): any;
    toJSON(): string[];
}
export interface Clock {
    restore(): void;
    setSystemTime(now?: Date | number): void;
    tick(time: number): void;
}
export interface Cookie {
    domain: string;
    expiry?: number;
    hostOnly?: boolean;
    httpOnly: boolean;
    name: string;
    path: string;
    sameSite?: SameSiteStatus;
    secure: boolean;
    value: string;
}
export interface EnqueuedCommandAttributes {
    args: any[];
    chainerId: string;
    fn(...args: any[]): any;
    id: string;
    injected: boolean;
    name: string;
    query?: boolean;
    type: string;
    userInvocationStack?: string;
}
export interface Command {
    get<K extends keyof EnqueuedCommandAttributes>(attr: K): EnqueuedCommandAttributes[K];
    get(): EnqueuedCommandAttributes;
    set<K extends keyof EnqueuedCommandAttributes>(
        key: K,
        value: EnqueuedCommandAttributes[K]
    ): Log;
    set(options: Partial<EnqueuedCommandAttributes>): Log;
}
export interface Exec {
    code: number;
    stderr: string;
    stdout: string;
}
export type TypedArray =
    | Float32Array
    | Float64Array
    | Int16Array
    | Int32Array
    | Int8Array
    | Uint16Array
    | Uint32Array
    | Uint8Array
    | Uint8ClampedArray;
export type FileReference = BufferType | FileReferenceObject | string | TypedArray;
export interface FileReferenceObject {
    contents: any;
    fileName?: string;
    lastModified?: number;
    mimeType?: string;
}
export interface LogAttrs {
    consoleProps: ObjectLike;
    url: string;
}
export interface Log {
    end(): Log;
    error(error: Error): Log;
    finish(): void;
    get<K extends keyof LogConfig>(attr: K): LogConfig[K];
    get(): LogConfig;
    set<K extends keyof LogConfig>(key: K, value: LogConfig[K]): Log;
    set(options: Partial<LogConfig>): Log;
    snapshot(name?: string, options?: { at?: number; next: string }): Log;
}
export interface LogConfig extends Timeoutable {
    $el: JQuery;
    autoEnd: boolean;
    consoleProps(): ObjectLike;
    displayName: string;
    end: boolean;
    id: string;
    message: any;
    name: string;
    type: "child" | "parent";
}
export interface Response<T> {
    allRequestResponses: any[];
    body: T;
    duration: number;
    headers: Record<string, string | string[]>;
    isOkStatusCode: boolean;
    redirectedToUrl?: string;
    redirects?: string[];
    requestHeaders: Record<string, string>;
    status: number;
    statusText: string;
}
export interface Server extends RouteOptions {
    enable: boolean;
    ignore: (xhr: any) => boolean;
}
export interface Viewport {
    viewportHeight: number;
    viewportWidth: number;
}
export type Encodings =
    | "ascii"
    | "base64"
    | "binary"
    | "hex"
    | "latin1"
    | "ucs-2"
    | "ucs2"
    | "utf-16le"
    | "utf-8"
    | "utf16le"
    | "utf8"
    | null;
export type PositionType =
    | "bottom"
    | "bottomLeft"
    | "bottomRight"
    | "center"
    | "left"
    | "right"
    | "top"
    | "topLeft"
    | "topRight";
export type ViewportPreset =
    | "ipad-2"
    | "ipad-mini"
    | "iphone-3"
    | "iphone-4"
    | "iphone-5"
    | "iphone-6"
    | "iphone-6+"
    | "iphone-7"
    | "iphone-8"
    | "iphone-se2"
    | "iphone-x"
    | "iphone-xr"
    | "macbook-11"
    | "macbook-13"
    | "macbook-15"
    | "macbook-16"
    | "samsung-note9"
    | "samsung-s10";
export interface Offset {
    left: number;
    top: number;
}
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
