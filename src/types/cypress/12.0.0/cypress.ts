import Minimatch from "cypress/types/cy-minimatch";

type FileContents = string | unknown[] | object;
type HistoryDirection = "back" | "forward";
type HttpMethod = string;
type RequestBody = string | object;
type ViewportOrientation = "portrait" | "landscape";
type PrevSubject = keyof PrevSubjectMap;
export type TestingType = "e2e" | "component";
type PluginConfig = (
    on: PluginEvents,
    config: PluginConfigOptions
) => void | ConfigOptions | Promise<ConfigOptions>;
interface JQueryWithSelector<TElement = HTMLElement> extends JQuery<TElement> {
    selector?: string | null;
}
interface PrevSubjectMap<O = unknown> {
    optional: O;
    element: JQueryWithSelector;
    document: Document;
    window: Window;
}
interface CommandOptions {
    prevSubject: boolean | PrevSubject | PrevSubject[];
}
interface CommandFn<T extends keyof ChainableMethods> {
    (this: Mocha.Context, ...args: Parameters<ChainableMethods[T]>): ReturnType<
        ChainableMethods[T]
    > | void;
}
interface CommandFns {
    [name: string]: (this: Mocha.Context, ...args: unknown[]) => unknown;
}
interface CommandFnWithSubject<T extends keyof ChainableMethods, S> {
    (this: Mocha.Context, prevSubject: S, ...args: Parameters<ChainableMethods[T]>): ReturnType<
        ChainableMethods[T]
    > | void;
}
interface CommandFnsWithSubject<S> {
    [name: string]: (this: Mocha.Context, prevSubject: S, ...args: unknown[]) => unknown;
}
interface CommandOriginalFn<T extends keyof ChainableMethods> extends CallableFunction {
    (...args: Parameters<ChainableMethods[T]>): ReturnType<ChainableMethods[T]>;
}
interface CommandOriginalFnWithSubject<T extends keyof ChainableMethods, S>
    extends CallableFunction {
    (prevSubject: S, ...args: Parameters<ChainableMethods[T]>): ReturnType<ChainableMethods[T]>;
}
interface CommandFnWithOriginalFn<T extends keyof Chainable> {
    (
        this: Mocha.Context,
        originalFn: CommandOriginalFn<T>,
        ...args: Parameters<ChainableMethods[T]>
    ): ReturnType<ChainableMethods[T]> | void;
}
interface CommandFnWithOriginalFnAndSubject<T extends keyof Chainable, S> {
    (
        this: Mocha.Context,
        originalFn: CommandOriginalFnWithSubject<T, S>,
        prevSubject: S,
        ...args: Parameters<ChainableMethods[T]>
    ): ReturnType<ChainableMethods[T]> | void;
}
interface QueryFn<T extends keyof ChainableMethods> {
    (this: Command, ...args: Parameters<ChainableMethods[T]>): (subject: unknown) => unknown;
}
interface QueryFnWithOriginalFn<T extends keyof Chainable> {
    (this: Command, originalFn: QueryFn<T>, ...args: Parameters<ChainableMethods[T]>): (
        subject: unknown
    ) => unknown;
}
interface ObjectLike {
    [key: string]: unknown;
}
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
interface Backend {
    (task: "firefox:force:gc"): Promise<void>;
    (task: "net", eventName: string, frame: unknown): Promise<void>;
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
interface Ensure {
    isType(subject: unknown, type: PrevSubject[], commandName: string, cy: Chainable): void;
    isElement(subject: unknown, commandName: string, cy: Chainable): void;
    isDocument(subject: unknown, commandName: string, cy: Chainable): void;
    isWindow(subject: unknown, commandName: string, cy: Chainable): void;
    isAttached(subject: unknown, commandName: string, cy: Chainable, onFail?: Log): void;
    isNotDisabled(subject: unknown, commandName: string, onFail?: Log): void;
    isNotHiddenByAncestors(subject: unknown, commandName: string, onFail?: Log): void;
    isNotReadonly(subject: unknown, commandName: string, onFail?: Log): void;
    isScrollable(subject: unknown, commandName: string, onFail?: Log): void;
    isVisible(subject: unknown, commandName: string, onFail?: Log): void;
}
interface LocalStorage {
    clear: (keys?: string[]) => void;
}
type Storable = string | number | boolean | null | StorableObject | StorableArray;
interface StorableObject {
    [key: string]: Storable;
}
type StorableArray = Array<Storable>;
type StorableRecord = Record<string, Storable>;
interface OriginStorage {
    origin: string;
    value: StorableRecord;
}
interface Storages {
    localStorage: OriginStorage[];
    sessionStorage: OriginStorage[];
}
interface StorageByOrigin {
    [key: string]: StorableRecord;
}
type IsBrowserMatcher = BrowserName | Partial<Browser> | Array<BrowserName | Partial<Browser>>;
interface ViewportPosition extends WindowPosition {
    right: number;
    bottom: number;
}
interface WindowPosition {
    top: number;
    left: number;
    topCenter: number;
    leftCenter: number;
}
interface ElementPositioning {
    scrollTop: number;
    scrollLeft: number;
    width: number;
    height: number;
    fromElViewport: ViewportPosition;
    fromElWindow: WindowPosition;
    fromAutWindow: WindowPosition;
}
interface ElementCoordinates {
    width: number;
    height: number;
    fromElViewport: ViewportPosition & { x: number; y: number };
    fromElWindow: WindowPosition & { x: number; y: number };
    fromAutWindow: WindowPosition & { x: number; y: number };
}
type CypressSpecType = "integration" | "component";
interface Spec {
    name: string;
    relative: string;
    absolute: string;
    specFilter?: string;
    specType?: CypressSpecType;
}
type AUTWindow = Window & typeof globalThis & NonNullable<unknown>;
type Config = ResolvedConfigOptions & RuntimeConfigOptions & RuntimeServerConfigOptions;
interface Cypress {
    _: _.LoDashStatic;
    $: JQueryStatic;
    Blob: BlobUtil.BlobUtilStatic;
    Buffer: BufferType;
    minimatch: typeof Minimatch.minimatch;
    Promise: Bluebird.BluebirdStatic;
    sinon: sinon.SinonStatic;
    ensure: Ensure;
    version: string;
    platform: string;
    arch: string;
    spec: Spec;
    currentTest: {
        title: string;
        titlePath: string[];
    };
    currentRetry: number;
    browser: Browser;
    LocalStorage: LocalStorage;
    session: Session;
    testingType: TestingType;
    automation(eventName: string, ...args: unknown[]): Bluebird.Promise<unknown>;
    backend: Backend;
    config(): Config;
    config<K extends keyof Config>(key: K): Config[K];
    config<K extends keyof TestConfigOverrides>(key: K, value: TestConfigOverrides[K]): void;
    config(Object: TestConfigOverrides): void;
    env(): ObjectLike;
    env(key: string): unknown;
    env(key: string, value: unknown): void;
    env(object: ObjectLike): void;
    getTestRetries(): number | null;
    isCy<TSubject = unknown>(obj: Chainable<TSubject>): obj is Chainable<TSubject>;
    isCy(obj: unknown): obj is Chainable;
    isBrowser(name: IsBrowserMatcher): boolean;
    log(options: Partial<LogConfig>): Log;
    Commands: {
        add<T extends keyof Chainable>(name: T, fn: CommandFn<T>): void;
        add<T extends keyof Chainable>(
            name: T,
            options: CommandOptions & { prevSubject: false },
            fn: CommandFn<T>
        ): void;
        add<T extends keyof Chainable, S = unknown>(
            name: T,
            options: CommandOptions & { prevSubject: true },
            fn: CommandFnWithSubject<T, S>
        ): void;
        add<T extends keyof Chainable, S extends PrevSubject>(
            name: T,
            options: CommandOptions & { prevSubject: S | ["optional"] },
            fn: CommandFnWithSubject<T, PrevSubjectMap[S]>
        ): void;
        add<T extends keyof Chainable, S extends PrevSubject>(
            name: T,
            options: CommandOptions & { prevSubject: S[] },
            fn: CommandFnWithSubject<T, PrevSubjectMap<void>[S]>
        ): void;
        addAll(fns: CommandFns): void;
        addAll(options: CommandOptions & { prevSubject: false }, fns: CommandFns): void;
        addAll<S = unknown>(
            options: CommandOptions & { prevSubject: true },
            fns: CommandFnsWithSubject<S>
        ): void;
        addAll<S extends PrevSubject>(
            options: CommandOptions & { prevSubject: S | ["optional"] },
            fns: CommandFnsWithSubject<PrevSubjectMap[S]>
        ): void;
        addAll<S extends PrevSubject>(
            options: CommandOptions & { prevSubject: S[] },
            fns: CommandFnsWithSubject<PrevSubjectMap<void>[S]>
        ): void;
        overwrite<T extends keyof Chainable>(name: T, fn: CommandFnWithOriginalFn<T>): void;
        overwrite<T extends keyof Chainable, S extends PrevSubject>(
            name: T,
            fn: CommandFnWithOriginalFnAndSubject<T, PrevSubjectMap[S]>
        ): void;
        addQuery<T extends keyof Chainable>(name: T, fn: QueryFn<T>): void;
        overwriteQuery<T extends keyof Chainable>(name: T, fn: QueryFnWithOriginalFn<T>): void;
    };
    Cookies: {
        debug(enabled: boolean, options?: Partial<DebugOptions>): void;
    };
    dom: {
        wrap(
            wrappingElement_function:
                | JQuery.Selector
                | JQuery.htmlString
                | Element
                | JQuery
                | ((index: number) => string | JQuery)
        ): JQuery;
        query(selector: JQuery.Selector, context?: Element | JQuery): JQuery;
        unwrap(obj: unknown): unknown;
        isDom(obj: unknown): boolean;
        isType(element: JQuery | HTMLElement, type: string): boolean;
        isVisible(element: JQuery | HTMLElement): boolean;
        isHidden(element: JQuery | HTMLElement, methodName?: string, options?: object): boolean;
        isFocusable(element: JQuery | HTMLElement): boolean;
        isTextLike(element: JQuery | HTMLElement): boolean;
        isScrollable(element: Window | JQuery | HTMLElement): boolean;
        isFocused(element: JQuery | HTMLElement): boolean;
        isDetached(element: JQuery | HTMLElement): boolean;
        isAttached(element: JQuery | HTMLElement | Window | Document): boolean;
        isSelector(element: JQuery | HTMLElement, selector: JQuery.Selector): boolean;
        isDescendent(element1: JQuery | HTMLElement, element2: JQuery | HTMLElement): boolean;
        isUndefinedOrHTMLBodyDoc(obj: unknown): boolean;
        isElement(obj: unknown): boolean;
        isDocument(obj: unknown): boolean;
        isWindow(obj: unknown): obj is Window;
        isJquery(obj: unknown): obj is JQuery;
        isInputType(element: JQuery | HTMLElement, type: string | string[]): boolean;
        stringify(element: JQuery | HTMLElement, form: string): string;
        getElements(element: JQuery): JQuery | HTMLElement[];
        getContainsSelector(text: string, filter?: string): JQuery.Selector;
        getFirstDeepestElement(elements: HTMLElement[], index?: number): HTMLElement;
        getWindowByElement(element: JQuery | HTMLElement): JQuery | HTMLElement;
        getReasonIsHidden(element: JQuery | HTMLElement, options?: object): string;
        getFirstScrollableParent(element: JQuery | HTMLElement): JQuery | HTMLElement;
        getFirstFixedOrStickyPositionParent(element: JQuery | HTMLElement): JQuery | HTMLElement;
        getFirstStickyPositionParent(element: JQuery | HTMLElement): JQuery | HTMLElement;
        getCoordsByPosition(
            left: number,
            top: number,
            xPosition?: string,
            yPosition?: string
        ): number;
        getElementPositioning(element: JQuery | HTMLElement): ElementPositioning;
        getElementAtPointFromViewport(doc: Document, x: number, y: number): Element | null;
        getElementCoordinatesByPosition(
            element: JQuery | HTMLElement,
            position: string
        ): ElementCoordinates;
        getElementCoordinatesByPositionRelativeToXY(
            element: JQuery | HTMLElement,
            x: number,
            y: number
        ): ElementPositioning;
    };
    Keyboard: {
        defaults(options: Partial<KeyboardDefaultsOptions>): void;
    };
    Screenshot: {
        defaults(options: Partial<ScreenshotDefaultsOptions>): void;
    };
    SelectorPlayground: {
        defaults(options: Partial<SelectorPlaygroundDefaultsOptions>): void;
        getSelector($el: JQuery): JQuery.Selector;
    };
    on: Actions;
    once: Actions;
    off: Actions;
    require: <T = unknown>(id: string) => T;
    action: (action: string, ...args: unknown[]) => unknown[] | void;
    onSpecWindow: (window: Window, specList: string[] | Array<() => Promise<void>>) => void;
}
type CanReturnChainable = void | Chainable | Promise<unknown>;
type ThenReturn<S, R> = R extends void
    ? Chainable<S>
    : R extends R | undefined
    ? Chainable<S | Exclude<R, undefined>>
    : Chainable<S>;
interface Chainable<Subject = unknown> {
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
    clearCookie(name: string, options?: CookieOptions): Chainable<null>;
    clearCookies(options?: CookieOptions): Chainable<null>;
    clearAllCookies(options?: Partial<Loggable & Timeoutable>): Chainable<null>;
    getAllLocalStorage(options?: Partial<Loggable>): Chainable<StorageByOrigin>;
    clearAllLocalStorage(options?: Partial<Loggable>): Chainable<null>;
    getAllSessionStorage(options?: Partial<Loggable>): Chainable<StorageByOrigin>;
    clearAllSessionStorage(options?: Partial<Loggable>): Chainable<null>;
    clearLocalStorage(key?: string): Chainable<Storage>;
    clearLocalStorage(re: RegExp): Chainable<Storage>;
    clearLocalStorage(options: Partial<Loggable>): Chainable<Storage>;
    clearLocalStorage(key: string, options: Partial<Loggable>): Chainable<Storage>;
    click(options?: Partial<ClickOptions>): Chainable<Subject>;
    click(position: PositionType, options?: Partial<ClickOptions>): Chainable<Subject>;
    click(x: number, y: number, options?: Partial<ClickOptions>): Chainable<Subject>;
    clock(): Chainable<Clock>;
    clock(now: number | Date, options?: Loggable): Chainable<Clock>;
    clock(
        now: number | Date,
        functions?: Array<"setTimeout" | "clearTimeout" | "setInterval" | "clearInterval" | "Date">,
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
        content: string | number | RegExp,
        options?: Partial<Loggable & Timeoutable & CaseMatchable & Shadow>
    ): Chainable<Subject>;
    contains<E extends Node = HTMLElement>(content: string | number | RegExp): Chainable<JQuery<E>>;
    contains<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        text: string | number | RegExp,
        options?: Partial<Loggable & Timeoutable & CaseMatchable & Shadow>
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    contains<E extends Node = HTMLElement>(
        selector: string,
        text: string | number | RegExp,
        options?: Partial<Loggable & Timeoutable & CaseMatchable & Shadow>
    ): Chainable<JQuery<E>>;
    dblclick(options?: Partial<ClickOptions>): Chainable<Subject>;
    dblclick(position: PositionType, options?: Partial<ClickOptions>): Chainable<Subject>;
    dblclick(x: number, y: number, options?: Partial<ClickOptions>): Chainable<Subject>;
    rightclick(options?: Partial<ClickOptions>): Chainable<Subject>;
    rightclick(position: PositionType, options?: Partial<ClickOptions>): Chainable<Subject>;
    rightclick(x: number, y: number, options?: Partial<ClickOptions>): Chainable<Subject>;
    debug(options?: Partial<Loggable>): Chainable<Subject>;
    session(id: string | object, setup: () => void, options?: SessionOptions): Chainable<null>;
    document(options?: Partial<Loggable & Timeoutable>): Chainable<Document>;
    each<E extends Node = HTMLElement>(
        fn: (element: JQuery<E>, index: number, $list: E[]) => void
    ): Chainable<JQuery<E>>;
    each(fn: (item: unknown, index: number, $list: unknown[]) => void): Chainable<Subject>;
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
    fixture<Contents = unknown>(path: string, options?: Partial<Timeoutable>): Chainable<Contents>;
    fixture<Contents = unknown>(
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
    get<S = unknown>(
        alias: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;
    getCookie(name: string, options?: CookieOptions): Chainable<Cookie | null>;
    getCookies(options?: CookieOptions): Chainable<Cookie[]>;
    getAllCookies(options?: Partial<Loggable & Timeoutable>): Chainable<Cookie[]>;
    go(
        direction: HistoryDirection | number,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<AUTWindow>;
    hash(options?: Partial<Loggable & Timeoutable>): Chainable<string>;
    invoke<
        K extends keyof Subject,
        F extends ((...args: unknown[]) => unknown) & Subject[K],
        R = ReturnType<F>
    >(
        functionName: K,
        ...args: unknown[]
    ): Chainable<R>;
    invoke<
        K extends keyof Subject,
        F extends ((...args: unknown[]) => unknown) & Subject[K],
        R = ReturnType<F>
    >(
        options: Partial<Loggable & Timeoutable>,
        functionName: K,
        ...args: unknown[]
    ): Chainable<R>;
    invoke<T extends (...args: unknown[]) => unknown>(index: number): Chainable<ReturnType<T>>;
    invoke<T extends (...args: unknown[]) => unknown>(
        options: Partial<Loggable & Timeoutable>,
        index: number
    ): Chainable<ReturnType<T>>;
    invoke(propertyPath: string, ...args: unknown[]): Chainable;
    its<K extends keyof Subject>(
        propertyName: K,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<Subject[K]>;
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
    log(message: string, ...args: unknown[]): Chainable<null>;
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
    now(name: string, ...args: unknown[]): Promise<unknown> | ((subject: unknown) => unknown);
    on: Actions;
    once: Actions;
    off: Actions;
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
    readFile<Contents = unknown>(
        filePath: string,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<Contents>;
    readFile<Contents = unknown>(
        filePath: string,
        encoding: Encodings,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<Contents>;
    reload(): Chainable<AUTWindow>;
    reload(options: Partial<Loggable & Timeoutable>): Chainable<AUTWindow>;
    reload(forceReload: boolean): Chainable<AUTWindow>;
    reload(forceReload: boolean, options: Partial<Loggable & Timeoutable>): Chainable<AUTWindow>;
    request<T = unknown>(url: string, body?: RequestBody): Chainable<CypressResponse<T>>;
    request<T = unknown>(
        method: HttpMethod,
        url: string,
        body?: RequestBody
    ): Chainable<CypressResponse<T>>;
    request<T = unknown>(options: Partial<RequestOptions>): Chainable<CypressResponse<T>>;
    root<E extends Node = HTMLHtmlElement>(options?: Partial<Loggable>): Chainable<JQuery<E>>;
    screenshot(options?: Partial<Loggable & Timeoutable & ScreenshotOptions>): Chainable<null>;
    screenshot(
        fileName: string,
        options?: Partial<Loggable & Timeoutable & ScreenshotOptions>
    ): Chainable<null>;
    scrollIntoView(options?: Partial<ScrollIntoViewOptions>): Chainable<Subject>;
    scrollTo(position: PositionType, options?: Partial<ScrollToOptions>): Chainable<Subject>;
    scrollTo(
        x: number | string,
        y: number | string,
        options?: Partial<ScrollToOptions>
    ): Chainable<Subject>;
    select(
        valueOrTextOrIndex: string | number | Array<string | number>,
        options?: Partial<SelectOptions>
    ): Chainable<Subject>;
    selectFile(
        files: FileReference | FileReference[],
        options?: Partial<SelectFileOptions>
    ): Chainable<Subject>;
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
    spy(): Agent<sinon.SinonSpy>;
    spy(func: (...args: unknown[]) => unknown): Agent<sinon.SinonSpy>;
    spy<T>(obj: T, method: keyof T): Agent<sinon.SinonSpy>;
    stub(): Agent<sinon.SinonStub>;
    stub(obj: unknown): Agent<sinon.SinonStub>;
    stub<T>(obj: T, method: keyof T): Agent<sinon.SinonStub>;
    stub<T>(obj: T, method: keyof T, func: (...args: unknown[]) => unknown): Agent<sinon.SinonStub>;
    submit(options?: Partial<Loggable & Timeoutable>): Chainable<Subject>;
    spread<S extends object | unknown[] | string | number | boolean>(
        fn: (...args: unknown[]) => S
    ): Chainable<S>;
    spread(fn: (...args: unknown[]) => void): Chainable<Subject>;
    task<S = unknown>(
        event: string,
        arg?: unknown,
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
    then<S extends string | number | boolean>(
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<S>;
    then<S extends HTMLElement>(
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<JQuery<S>>;
    then<S extends ArrayLike<HTMLElement>>(
        fn: (this: ObjectLike, currentSubject: Subject) => S
    ): Chainable<JQuery<S extends ArrayLike<infer T> ? T : never>>;
    then<S extends unknown[] | object>(
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
    then<S extends object | unknown[] | string | number | boolean>(
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
    wrap<F extends Promise<S>, S>(
        promise: F,
        options?: Partial<Loggable & Timeoutable>
    ): Chainable<S>;
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
    $$<TElement extends Element = HTMLElement>(
        selector: JQuery.Selector,
        context?: Element | Document | JQuery
    ): JQuery<TElement>;
}
type ChainableMethods<Subject = unknown> = {
    [P in keyof Chainable<Subject>]: Chainable<Subject>[P] extends (...args: unknown[]) => unknown
        ? Chainable<Subject>[P]
        : never;
};
interface SinonSpyAgent<A extends sinon.SinonSpy> {
    log(shouldOutput?: boolean): Omit<A, "withArgs"> & Agent<A>;
    as(alias: string): Omit<A, "withArgs"> & Agent<A>;
    withArgs(...args: unknown[]): Omit<A, "withArgs"> & Agent<A>;
}
type Agent<T extends sinon.SinonSpy> = SinonSpyAgent<T> & T;
interface Failable {
    failOnStatusCode: boolean;
    retryOnStatusCodeFailure: boolean;
    retryOnNetworkFailure: boolean;
}
interface Withinable {
    withinSubject: JQuery | HTMLElement | null;
}
interface Shadow {
    includeShadowDom: boolean;
}
interface Loggable {
    log: boolean;
}
interface Timeoutable {
    timeout: number;
}
interface CaseMatchable {
    matchCase: boolean;
}
interface TimeoutableXHR {
    requestTimeout: number;
    responseTimeout: number;
}
interface Forceable {
    force: boolean;
}
type experimentalCspAllowedDirectives =
    | "default-src"
    | "child-src"
    | "frame-src"
    | "script-src"
    | "script-src-elem"
    | "form-action";
type scrollBehaviorOptions = false | "center" | "top" | "bottom" | "nearest";
interface ActionableOptions extends Forceable {
    waitForAnimations: boolean;
    animationDistanceThreshold: number;
    scrollBehavior: scrollBehaviorOptions;
}
interface AsOptions {
    type: "query" | "static";
}
interface BlurOptions extends Loggable, Timeoutable, Forceable {}
interface CheckOptions extends Loggable, Timeoutable, ActionableOptions {
    interval: number;
}
interface ClearOptions extends Loggable, Timeoutable, ActionableOptions {
    interval: number;
}
interface ClickOptions extends Loggable, Timeoutable, ActionableOptions {
    multiple: boolean;
    ctrlKey: boolean;
    controlKey: boolean;
    altKey: boolean;
    optionKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    commandKey: boolean;
    cmdKey: boolean;
}
interface CookieOptions extends Partial<Loggable & Timeoutable> {
    domain?: string;
}
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
    env: { [key: string]: unknown };
    excludeSpecPattern: string | string[];
    numTestsKeptInMemory: number;
    port: number | null;
    reporter: string;
    reporterOptions: { [key: string]: unknown };
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
    hosts: null | { [key: string]: string };
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
    specs: Array<Cypress["spec"]>;
}
interface SuiteConfigOverrides
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
                | "slowTestThreshold"
                | "scrollBehavior"
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
interface TestConfigOverrides
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
                | "slowTestThreshold"
                | "scrollBehavior"
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
type CoreConfigOptions = Partial<Omit<ResolvedConfigOptions, TestingType>>;
interface DefineDevServerConfig {
    [key: string]: unknown;
}
type PickConfigOpt<T> = T extends keyof DefineDevServerConfig ? DefineDevServerConfig[T] : unknown;
interface DependencyToInstall {
    dependency: CypressComponentDependency;
    satisfied: boolean;
    detectedVersion: string | null;
}
interface CypressComponentDependency {
    type: string;
    name: string;
    package: string;
    installer: string;
    description: string;
    minVersion: string;
}
interface ResolvedComponentFrameworkDefinition {
    type: string;
    configFramework: string;
    category: "library" | "template";
    name: string;
    supportedBundlers: Array<"webpack" | "vite">;
    detectors: CypressComponentDependency[];
    dependencies: (
        bundler: "webpack" | "vite",
        projectPath: string
    ) => Promise<DependencyToInstall[]>;
    codeGenFramework?: "react" | "vue" | "svelte" | "angular";
    glob?: string;
    mountModule: (projectPath: string) => Promise<string>;
    supportStatus: "alpha" | "beta" | "full" | "community";
    componentIndexHtml?: () => string;
    specPattern?: "**/*.cy.ts";
}
type ComponentFrameworkDefinition = Omit<ResolvedComponentFrameworkDefinition, "dependencies"> & {
    dependencies: (bundler: "webpack" | "vite") => CypressComponentDependency[];
};
type ThirdPartyComponentFrameworkDefinition = Pick<
    ComponentFrameworkDefinition,
    "type" | "name" | "supportedBundlers" | "detectors" | "dependencies"
> & {
    type: string;
    icon?: string;
};
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
          viteConfig?: ConfigHandler<
              Omit<Exclude<PickConfigOpt<"viteConfig">, undefined>, "base" | "root">
          >;
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
    hosts?: null | { [key: string]: string };
};
interface PluginConfigOptions extends ResolvedConfigOptions, RuntimeConfigOptions {
    projectRoot: string;
    testingType: TestingType;
    version: string;
}
interface DebugOptions {
    verbose: boolean;
}
interface ExecOptions extends Loggable, Timeoutable {
    failOnNonZeroExit: boolean;
    env: object;
}
interface KeyboardDefaultsOptions {
    keystrokeDelay: number;
}
interface RequestOptions extends Loggable, Timeoutable, Failable {
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
interface RouteOptions {
    method: HttpMethod;
    url: string | RegExp;
    response: unknown;
    status: number;
    delay: number;
    headers: object | null;
    force404: boolean;
    onRequest(...args: unknown[]): void;
    onResponse(...args: unknown[]): void;
    onAbort(...args: unknown[]): void;
}
interface Dimensions {
    x: number;
    y: number;
    width: number;
    height: number;
}
type Padding =
    | number
    | [number]
    | [number, number]
    | [number, number, number]
    | [number, number, number, number];
interface ScreenshotOptions {
    blackout: string[];
    capture: "runner" | "viewport" | "fullPage";
    clip: Dimensions;
    disableTimersAndAnimations: boolean;
    padding: Padding;
    scale: boolean;
    overwrite: boolean;
    onBeforeScreenshot: ($el: JQuery) => void;
    onAfterScreenshot: (
        $el: JQuery,
        props: {
            path: string;
            size: number;
            dimensions: {
                width: number;
                height: number;
            };
            multipart: boolean;
            pixelRatio: number;
            takenAt: string;
            name: string;
            blackout: string[];
            duration: number;
            testAttemptIndex: number;
        }
    ) => void;
}
interface ScreenshotDefaultsOptions extends ScreenshotOptions {
    screenshotOnRunFailure: boolean;
}
interface SelectorPlaygroundDefaultsOptions {
    selectorPriority: string[];
    onElement: ($el: JQuery) => string | null | undefined;
}
interface ScrollToOptions extends Loggable, Timeoutable {
    duration: number;
    easing: "swing" | "linear";
    ensureScrollable: boolean;
}
interface ScrollIntoViewOptions extends ScrollToOptions {
    offset: Offset;
}
interface SelectOptions extends Loggable, Timeoutable, Forceable {
    interval: number;
}
interface Session {
    clearAllSavedSessions: () => Promise<void>;
    clearCurrentSessionData: () => Promise<void>;
    getCurrentSessionData: () => Promise<SessionData>;
    getSession: (id: string) => Promise<ServerSessionData>;
}
type ActiveSessions = Record<string, SessionData>;
interface SessionData {
    id: string;
    hydrated: boolean;
    cacheAcrossSpecs: SessionOptions["cacheAcrossSpecs"];
    cookies?: Cookie[] | null;
    localStorage?: OriginStorage[] | null;
    sessionStorage?: OriginStorage[] | null;
    setup: () => void;
    validate?: SessionOptions["validate"];
}
interface ServerSessionData extends Omit<SessionData, "setup" | "validate"> {
    setup: string;
    validate?: string;
}
interface SessionOptions {
    cacheAcrossSpecs?: boolean;
    validate?: () => Promise<false | void> | void;
}
type SameSiteStatus = "no_restriction" | "strict" | "lax";
interface SelectFileOptions extends Loggable, Timeoutable, ActionableOptions {
    action: "select" | "drag-drop";
}
interface SetCookieOptions extends Loggable, Timeoutable {
    path: string;
    domain: string;
    secure: boolean;
    httpOnly: boolean;
    hostOnly: boolean;
    expiry: number;
    sameSite: SameSiteStatus;
}
interface ShadowDomOptions {
    includeShadowDom?: boolean;
}
interface TypeOptions extends Loggable, Timeoutable, ActionableOptions {
    delay: number;
    parseSpecialCharSequences: boolean;
    release: boolean;
}
interface VisitOptions extends Loggable, Timeoutable, Failable {
    url: string;
    method: "GET" | "POST";
    body: RequestBody;
    headers: { [header: string]: string };
    onBeforeLoad(win: AUTWindow): void;
    onLoad(win: AUTWindow): void;
    auth: Auth;
    qs: object;
}
interface TriggerOptions extends Loggable, Timeoutable, ActionableOptions {
    bubbles: boolean;
    cancelable: boolean;
    eventConstructor: string;
}
interface UrlOptions extends Loggable, Timeoutable {
    decode: boolean;
}
interface WriteFileOptions extends Loggable {
    flag: string;
    encoding: Encodings;
}
interface Chainer<Subject> {
    (chainer: "be.a", type: string): Chainable<Subject>;
    (chainer: "be.above", value: number | Date): Chainable<Subject>;
    (chainer: "be.an", value: string): Chainable<Subject>;
    (chainer: "be.at.least", value: number | Date): Chainable<Subject>;
    (chainer: "be.below", value: number): Chainable<Subject>;
    (chainer: "be.arguments"): Chainable<Subject>;
    (chainer: "be.approximately", value: number, delta: number): Chainable<Subject>;
    (chainer: "be.closeTo", value: number, delta: number): Chainable<Subject>;
    (chainer: "be.empty"): Chainable<Subject>;
    (chainer: "be.instanceOf", value: unknown): Chainable<Subject>;
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
    (chainer: "change", fn: (...args: unknown[]) => unknown): Chainable<Subject>;
    (chainer: "change", obj: object, prop: string): Chainable<Subject>;
    (chainer: "contain", value: unknown): Chainable<Subject>;
    (chainer: "decrease", fn: (...args: unknown[]) => unknown): Chainable<Subject>;
    (chainer: "decrease", obj: object, prop: string): Chainable<Subject>;
    (chainer: "deep.equal", value: Subject): Chainable<Subject>;
    (chainer: "exist"): Chainable<Subject>;
    (chainer: "eq", value: unknown): Chainable<Subject>;
    (chainer: "eql", value: unknown): Chainable<Subject>;
    (chainer: "equal", value: unknown): Chainable<Subject>;
    (chainer: "have.all.key", ...value: string[]): Chainable<Subject>;
    (chainer: "have.unknown.key", ...value: string[]): Chainable<Subject>;
    (
        chainer: "have.all.keys" | "have.keys" | "have.deep.keys" | "have.all.deep.keys",
        ...value: string[]
    ): Chainable<Subject>;
    (chainer: "have.unknown.keys" | "include.unknown.keys", ...value: string[]): Chainable<Subject>;
    (chainer: "include.all.keys", ...value: string[]): Chainable<Subject>;
    (chainer: "have.deep.property", value: string, obj: object): Chainable<Subject>;
    (chainer: "have.length" | "have.lengthOf", value: number): Chainable<Subject>;
    (
        chainer: "have.length.greaterThan" | "have.lengthOf.greaterThan",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "have.length.gt"
            | "have.lengthOf.gt"
            | "have.length.above"
            | "have.lengthOf.above",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "have.length.gte"
            | "have.lengthOf.gte"
            | "have.length.at.least"
            | "have.lengthOf.at.least",
        value: number
    ): Chainable<Subject>;
    (chainer: "have.length.lessThan" | "have.lengthOf.lessThan", value: number): Chainable<Subject>;
    (
        chainer:
            | "have.length.lt"
            | "have.lengthOf.lt"
            | "have.length.below"
            | "have.lengthOf.below",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "have.length.lte"
            | "have.lengthOf.lte"
            | "have.length.at.most"
            | "have.lengthOf.at.most",
        value: number
    ): Chainable<Subject>;
    (
        chainer: "have.length.within" | "have.lengthOf.within",
        start: number,
        finish: number
    ): Chainable<Subject>;
    (chainer: "have.members" | "have.deep.members", values: unknown[]): Chainable<Subject>;
    (chainer: "have.ordered.members", values: unknown[]): Chainable<Subject>;
    (chainer: "have.ownProperty", property: string): Chainable<Subject>;
    (
        chainer:
            | "have.property"
            | "have.nested.property"
            | "have.own.property"
            | "have.a.property"
            | "have.deep.property"
            | "have.deep.own.property"
            | "have.deep.nested.property",
        property: string,
        value?: unknown
    ): Chainable<Subject>;
    (
        chainer: "have.ownPropertyDescriptor" | "haveOwnPropertyDescriptor",
        name: string,
        descriptor?: PropertyDescriptor
    ): Chainable<Subject>;
    (chainer: "have.string", match: string | RegExp): Chainable<Subject>;
    (
        chainer:
            | "include"
            | "deep.include"
            | "nested.include"
            | "own.include"
            | "deep.own.include"
            | "deep.nested.include",
        value: unknown
    ): Chainable<Subject>;
    (
        chainer: "include.members" | "include.ordered.members" | "include.deep.ordered.members",
        value: unknown[]
    ): Chainable<Subject>;
    (chainer: "increase", value: object, property?: string): Chainable<Subject>;
    (chainer: "match", value: RegExp): Chainable<Subject>;
    (chainer: "respondTo", value: string): Chainable<Subject>;
    (chainer: "satisfy", fn: (val: unknown) => boolean): Chainable<Subject>;
    (chainer: "throw", value?: string | RegExp): Chainable<Subject>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    (chainer: "throw", error: Error | Function, expected?: string | RegExp): Chainable<Subject>;
    (chainer: "be.oneOf", list: ReadonlyArray<unknown>): Chainable<Subject>;
    (chainer: "be.extensible"): Chainable<Subject>;
    (chainer: "be.sealed"): Chainable<Subject>;
    (chainer: "be.frozen"): Chainable<Subject>;
    (chainer: "be.finite"): Chainable<Subject>;
    (chainer: "not.be.a", type: string): Chainable<Subject>;
    (chainer: "not.be.above", value: number | Date): Chainable<Subject>;
    (chainer: "not.be.an", value: string): Chainable<Subject>;
    (chainer: "not.be.at.least", value: number | Date): Chainable<Subject>;
    (chainer: "not.be.below", value: number): Chainable<Subject>;
    (chainer: "not.be.arguments"): Chainable<Subject>;
    (chainer: "not.be.approximately", value: number, delta: number): Chainable<Subject>;
    (chainer: "not.be.closeTo", value: number, delta: number): Chainable<Subject>;
    (chainer: "not.be.empty"): Chainable<Subject>;
    (chainer: "not.be.instanceOf", value: unknown): Chainable<Subject>;
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
    (chainer: "not.change", fn: (...args: unknown[]) => unknown): Chainable<Subject>;
    (chainer: "not.change", obj: object, prop: string): Chainable<Subject>;
    (chainer: "not.contain", value: unknown): Chainable<Subject>;
    (chainer: "not.decrease", fn: (...args: unknown[]) => unknown): Chainable<Subject>;
    (chainer: "not.decrease", obj: object, prop: string): Chainable<Subject>;
    (chainer: "not.deep.equal", value: Subject): Chainable<Subject>;
    (chainer: "not.exist"): Chainable<Subject>;
    (chainer: "not.eq", value: unknown): Chainable<Subject>;
    (chainer: "not.eql", value: unknown): Chainable<Subject>;
    (chainer: "not.equal", value: unknown): Chainable<Subject>;
    (
        chainer:
            | "not.have.all.keys"
            | "not.have.keys"
            | "not.have.deep.keys"
            | "not.have.all.deep.keys",
        ...value: string[]
    ): Chainable<Subject>;
    (
        chainer: "not.have.unknown.keys" | "not.include.unknown.keys",
        ...value: string[]
    ): Chainable<Subject>;
    (chainer: "not.have.deep.property", value: string, obj: object): Chainable<Subject>;
    (chainer: "not.have.length" | "not.have.lengthOf", value: number): Chainable<Subject>;
    (
        chainer: "not.have.length.greaterThan" | "not.have.lengthOf.greaterThan",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "not.have.length.gt"
            | "not.have.lengthOf.gt"
            | "not.have.length.above"
            | "not.have.lengthOf.above",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "not.have.length.gte"
            | "not.have.lengthOf.gte"
            | "not.have.length.at.least"
            | "not.have.lengthOf.at.least",
        value: number
    ): Chainable<Subject>;
    (
        chainer: "not.have.length.lessThan" | "not.have.lengthOf.lessThan",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "not.have.length.lt"
            | "not.have.lengthOf.lt"
            | "not.have.length.below"
            | "not.have.lengthOf.below",
        value: number
    ): Chainable<Subject>;
    (
        chainer:
            | "not.have.length.lte"
            | "not.have.lengthOf.lte"
            | "not.have.length.at.most"
            | "not.have.lengthOf.at.most",
        value: number
    ): Chainable<Subject>;
    (
        chainer: "not.have.length.within" | "not.have.lengthOf.within",
        start: number,
        finish: number
    ): Chainable<Subject>;
    (chainer: "not.have.members" | "not.have.deep.members", values: unknown[]): Chainable<Subject>;
    (chainer: "not.have.ordered.members", values: unknown[]): Chainable<Subject>;
    (chainer: "not.have.ownProperty", property: string): Chainable<Subject>;
    (
        chainer:
            | "not.have.property"
            | "not.have.nested.property"
            | "not.have.own.property"
            | "not.have.a.property"
            | "not.have.deep.property"
            | "not.have.deep.own.property"
            | "not.have.deep.nested.property",
        property: string,
        value?: unknown
    ): Chainable<Subject>;
    (
        chainer: "not.have.ownPropertyDescriptor" | "not.haveOwnPropertyDescriptor",
        name: string,
        descriptor?: PropertyDescriptor
    ): Chainable<Subject>;
    (chainer: "not.have.string", match: string | RegExp): Chainable<Subject>;
    (
        chainer:
            | "not.include"
            | "not.deep.include"
            | "not.nested.include"
            | "not.own.include"
            | "not.deep.own.include"
            | "not.deep.nested.include",
        value: unknown
    ): Chainable<Subject>;
    (
        chainer:
            | "not.include.members"
            | "not.include.ordered.members"
            | "not.include.deep.ordered.members",
        value: unknown[]
    ): Chainable<Subject>;
    (chainer: "not.increase", value: object, property?: string): Chainable<Subject>;
    (chainer: "not.match", value: RegExp): Chainable<Subject>;
    (chainer: "not.respondTo", value: string): Chainable<Subject>;
    (chainer: "not.satisfy", fn: (val: unknown) => boolean): Chainable<Subject>;
    (chainer: "not.throw", value?: string | RegExp): Chainable<Subject>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    (chainer: "not.throw", error: Error | Function, expected?: string | RegExp): Chainable<Subject>;
    (chainer: "not.be.oneOf", list: ReadonlyArray<unknown>): Chainable<Subject>;
    (chainer: "not.be.extensible"): Chainable<Subject>;
    (chainer: "not.be.sealed"): Chainable<Subject>;
    (chainer: "not.be.frozen"): Chainable<Subject>;
    (chainer: "not.be.finite"): Chainable<Subject>;
    (chainer: "be.always.calledWithNew" | "always.have.been.calledWithNew"): Chainable<Subject>;
    (
        chainer: "be.always.calledWithMatch" | "always.have.been.calledWithMatch",
        ...args: unknown[]
    ): Chainable<Subject>;
    (chainer: "always.returned" | "have.always.returned", value: unknown): Chainable<Subject>;
    (chainer: "be.called" | "have.been.called"): Chainable<Subject>;
    (chainer: "be.calledAfter" | "have.been.calledAfter", spy: sinon.SinonSpy): Chainable<Subject>;
    (
        chainer: "be.calledBefore" | "have.been.calledBefore",
        spy: sinon.SinonSpy
    ): Chainable<Subject>;
    (chainer: "be.calledOn" | "have.been.calledOn", context: unknown): Chainable<Subject>;
    (chainer: "be.calledOnce" | "have.been.calledOnce"): Chainable<Subject>;
    (chainer: "be.calledThrice" | "have.been.calledThrice"): Chainable<Subject>;
    (chainer: "be.calledTwice" | "have.been.calledTwice"): Chainable<Subject>;
    (
        chainer: "be.calledWithExactly" | "have.been.calledWithExactly",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "be.calledWithMatch" | "have.been.calledWithMatch",
        ...args: unknown[]
    ): Chainable<Subject>;
    (chainer: "be.calledWithNew" | "have.been.calledWithNew"): Chainable<Subject>;
    (chainer: "have.always.thrown", value?: Error | typeof Error | string): Chainable<Subject>;
    (chainer: "have.callCount", value: number): Chainable<Subject>;
    (chainer: "have.thrown", value?: Error | typeof Error | string): Chainable<Subject>;
    (chainer: "returned" | "have.returned", value: unknown): Chainable<Subject>;
    (
        chainer: "be.calledImmediatelyBefore" | "have.been.calledImmediatelyBefore",
        anotherSpy: sinon.SinonSpy
    ): Chainable<Subject>;
    (
        chainer: "be.calledImmediatelyAfter" | "have.been.calledImmediatelyAfter",
        anotherSpy: sinon.SinonSpy
    ): Chainable<Subject>;
    (chainer: "be.always.calledOn" | "always.have.been.calledOn", obj: unknown): Chainable<Subject>;
    (chainer: "be.calledWith" | "have.been.calledWith", ...args: unknown[]): Chainable<Subject>;
    (
        chainer: "be.always.calledWith" | "always.have.been.calledWith",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "be.calledOnceWith" | "have.been.calledOnceWith",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "be.always.calledWithExactly" | "have.been.calledWithExactly",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "be.calledOnceWithExactly" | "have.been.calledOnceWithExactly",
        ...args: unknown[]
    ): Chainable<Subject>;
    (chainer: "have.always.returned", obj: unknown): Chainable<Subject>;
    (
        chainer: "not.be.always.calledWithNew" | "not.always.have.been.calledWithNew"
    ): Chainable<Subject>;
    (
        chainer: "not.be.always.calledWithMatch" | "not.always.have.been.calledWithMatch",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "not.always.returned" | "not.have.always.returned",
        value: unknown
    ): Chainable<Subject>;
    (chainer: "not.be.called" | "not.have.been.called"): Chainable<Subject>;
    (
        chainer: "not.be.calledAfter" | "not.have.been.calledAfter",
        spy: sinon.SinonSpy
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledBefore" | "not.have.been.calledBefore",
        spy: sinon.SinonSpy
    ): Chainable<Subject>;
    (chainer: "not.be.calledOn" | "not.have.been.calledOn", context: unknown): Chainable<Subject>;
    (chainer: "not.be.calledOnce" | "not.have.been.calledOnce"): Chainable<Subject>;
    (chainer: "not.be.calledThrice" | "not.have.been.calledThrice"): Chainable<Subject>;
    (chainer: "not.be.calledTwice" | "not.have.been.calledTwice"): Chainable<Subject>;
    (
        chainer: "not.be.calledWithExactly" | "not.have.been.calledWithExactly",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledWithMatch" | "not.have.been.calledWithMatch",
        ...args: unknown[]
    ): Chainable<Subject>;
    (chainer: "not.be.calledWithNew" | "not.have.been.calledWithNew"): Chainable<Subject>;
    (chainer: "not.have.always.thrown", value?: Error | typeof Error | string): Chainable<Subject>;
    (chainer: "not.have.callCount", value: number): Chainable<Subject>;
    (chainer: "not.have.thrown", value?: Error | typeof Error | string): Chainable<Subject>;
    (chainer: "not.returned" | "not.have.returned", value: unknown): Chainable<Subject>;
    (
        chainer: "not.be.calledImmediatelyBefore" | "not.have.been.calledImmediatelyBefore",
        anotherSpy: sinon.SinonSpy
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledImmediatelyAfter" | "not.have.been.calledImmediatelyAfter",
        anotherSpy: sinon.SinonSpy
    ): Chainable<Subject>;
    (
        chainer: "not.be.always.calledOn" | "not.always.have.been.calledOn",
        obj: unknown
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledWith" | "not.have.been.calledWith",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.always.calledWith" | "not.always.have.been.calledWith",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledOnceWith" | "not.have.been.calledOnceWith",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.always.calledWithExactly" | "not.have.been.calledWithExactly",
        ...args: unknown[]
    ): Chainable<Subject>;
    (
        chainer: "not.be.calledOnceWithExactly" | "not.have.been.calledOnceWithExactly",
        ...args: unknown[]
    ): Chainable<Subject>;
    (chainer: "not.have.always.returned", obj: unknown): Chainable<Subject>;
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
    (chainer: "have.prop", value: string, match?: unknown): Chainable<Subject>;
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
    (chainer: "not.have.prop", value: string, match?: unknown): Chainable<Subject>;
    (chainer: "not.have.text", value: string): Chainable<Subject>;
    (chainer: "not.contain.text", value: string): Chainable<Subject>;
    (chainer: "not.include.text", value: string): Chainable<Subject>;
    (chainer: "not.have.value", value: string): Chainable<Subject>;
    (chainer: "not.contain.value", value: string): Chainable<Subject>;
    (chainer: "not.include.value", value: string): Chainable<Subject>;
    (chainer: "not.match", value: string): Chainable<Subject>;
    (chainers: string, value?: unknown): Chainable<Subject>;
    (chainers: string, value: unknown, match: unknown): Chainable<Subject>;
    (fn: (currentSubject: Subject) => void): Chainable<Subject>;
}
interface BrowserLaunchOptions {
    extensions: string[];
    preferences: { [key: string]: unknown };
    args: string[];
    env: { [key: string]: unknown };
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
interface Tasks {
    [key: string]: Task;
}
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
        fn: (
            results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult
        ) => void | Promise<void>
    ): void;
    (
        action: "after:screenshot",
        fn: (
            details: ScreenshotDetails
        ) => void | AfterScreenshotReturnObject | Promise<AfterScreenshotReturnObject>
    ): void;
    (
        action: "after:spec",
        fn: (spec: Spec, results: CypressCommandLine.RunResult) => void | Promise<void>
    ): void;
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
interface CodeFrame {
    frame: string;
    language: string;
    line: number;
    column: number;
    absoluteFile: string;
    originalFile: string;
    relativeFile: string;
}
interface CypressError extends Error {
    docsUrl?: string;
    codeFrame?: CodeFrame;
}
interface Actions {
    (
        action: "uncaught:exception",
        fn: (error: Error, runnable: Mocha.Runnable, promise?: Promise<unknown>) => false | void
    ): Cypress;
    (
        action: "window:confirm",
        fn:
            | ((text: string) => false | void)
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
    (action: "log:added", fn: (attributes: ObjectLike, log: unknown) => void): Cypress;
    (action: "log:changed", fn: (attributes: ObjectLike, log: unknown) => void): Cypress;
    (action: "test:before:run", fn: (attributes: ObjectLike, test: Mocha.Test) => void): Cypress;
    (
        action: "test:before:run:async",
        fn: (attributes: ObjectLike, test: Mocha.Test) => void | Promise<unknown>
    ): Cypress;
    (action: "test:after:run", fn: (attributes: ObjectLike, test: Mocha.Test) => void): Cypress;
}
interface CommandQueue extends ObjectLike {
    logs(filters: unknown): unknown;
    add(obj: unknown): unknown;
    get(): unknown;
    get<K extends keyof CommandQueue>(key: string): CommandQueue[K];
    toJSON(): string[];
    create(): CommandQueue;
}
interface Clock {
    tick(time: number): void;
    restore(): void;
    setSystemTime(now?: number | Date): void;
}
interface Cookie {
    name: string;
    value: string;
    path: string;
    domain: string;
    hostOnly?: boolean;
    httpOnly: boolean;
    secure: boolean;
    expiry?: number;
    sameSite?: SameSiteStatus;
}
interface EnqueuedCommandAttributes {
    id: string;
    name: string;
    args: unknown[];
    type: string;
    chainerId: string;
    injected: boolean;
    userInvocationStack?: string;
    query?: boolean;
    fn(...args: unknown[]): unknown;
}
interface Command {
    get<K extends keyof EnqueuedCommandAttributes>(attr: K): EnqueuedCommandAttributes[K];
    get(): EnqueuedCommandAttributes;
    set<K extends keyof EnqueuedCommandAttributes>(
        key: K,
        value: EnqueuedCommandAttributes[K]
    ): Log;
    set(options: Partial<EnqueuedCommandAttributes>): Log;
}
interface Exec {
    code: number;
    stdout: string;
    stderr: string;
}
type FileReference = string | BufferType | FileReferenceObject;
interface FileReferenceObject {
    contents: unknown;
    fileName?: string;
    mimeType?: string;
    lastModified?: number;
}
interface LogAttrs {
    url: string;
    consoleProps: ObjectLike;
}
interface Log {
    end(): Log;
    error(error: Error): Log;
    finish(): void;
    get<K extends keyof LogConfig>(attr: K): LogConfig[K];
    get(): LogConfig;
    set<K extends keyof LogConfig>(key: K, value: LogConfig[K]): Log;
    set(options: Partial<LogConfig>): Log;
    snapshot(name?: string, options?: { at?: number; next: string }): Log;
}
interface LogConfig extends Timeoutable {
    id: string;
    $el: JQuery;
    type: "parent" | "child";
    name: string;
    displayName: string;
    message: unknown;
    autoEnd: boolean;
    end: boolean;
    consoleProps(): ObjectLike;
}
interface CypressResponse<T> {
    allRequestResponses: unknown[];
    body: T;
    duration: number;
    headers: { [key: string]: string | string[] };
    isOkStatusCode: boolean;
    redirects?: string[];
    redirectedToUrl?: string;
    requestHeaders: { [key: string]: string };
    status: number;
    statusText: string;
}
interface Server extends RouteOptions {
    enable: boolean;
    ignore: (xhr: unknown) => boolean;
}
interface Viewport {
    viewportWidth: number;
    viewportHeight: number;
}
type Encodings =
    | "ascii"
    | "base64"
    | "binary"
    | "hex"
    | "latin1"
    | "utf8"
    | "utf-8"
    | "ucs2"
    | "ucs-2"
    | "utf16le"
    | "utf-16le"
    | null;
type PositionType =
    | "topLeft"
    | "top"
    | "topRight"
    | "left"
    | "center"
    | "right"
    | "bottomLeft"
    | "bottom"
    | "bottomRight";
type ViewportPreset =
    | "macbook-16"
    | "macbook-15"
    | "macbook-13"
    | "macbook-11"
    | "ipad-2"
    | "ipad-mini"
    | "iphone-xr"
    | "iphone-x"
    | "iphone-6+"
    | "iphone-se2"
    | "iphone-8"
    | "iphone-7"
    | "iphone-6"
    | "iphone-5"
    | "iphone-4"
    | "iphone-3"
    | "samsung-s10"
    | "samsung-note9";
interface Offset {
    top: number;
    left: number;
}
type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & {
    [x: string]: never;
})[T];
