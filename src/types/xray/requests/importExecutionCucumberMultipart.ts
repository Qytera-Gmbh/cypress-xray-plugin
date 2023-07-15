import {
    CucumberMultipartInfoCloud,
    CucumberMultipartInfoServer,
} from "./importExecutionCucumberMultipartInfo";

export type CucumberMultipart<CucumberMultipartInfoType> = {
    features: CucumberMultipartFeature[];
    info: CucumberMultipartInfoType;
};
export type CucumberMultipartServer = CucumberMultipart<CucumberMultipartInfoServer>;
export type CucumberMultipartCloud = CucumberMultipart<CucumberMultipartInfoCloud>;
export interface CucumberMultipartFeature {
    uri: string;
    id?: string;
    line?: number;
    keyword: string;
    name: string;
    description?: string;
    elements: CucumberMultipartElement[];
    tags?: CucumberMultipartTag[];
}
export interface CucumberMultipartElement {
    start_timestamp?: string;
    line: number;
    id?: string;
    type: "background" | "scenario";
    keyword: string;
    name: string;
    description: string;
    before?: CucumberMultipartHook[];
    steps: CucumberMultipartStep[];
    after?: CucumberMultipartHook[];
    tags?: CucumberMultipartTag[];
}
export interface CucumberMultipartHook {
    match?: CucumberMultipartMatch;
    result: CucumberMultipartResult;
}
export interface CucumberMultipartMatch {
    location?: string;
    arguments?: CucumberMultipartArgument[];
}
export interface CucumberMultipartArgument {
    value: string;
    offset: number;
}
export interface CucumberMultipartResult {
    duration?: number;
    status: "passed" | "failed" | "skipped" | "undefined" | "pending" | "unknown";
    error_message?: string;
}
export interface CucumberMultipartStep {
    keyword: string;
    line: number;
    match?: CucumberMultipartMatch;
    name: string;
    result: CucumberMultipartResult;
    doc_string?: CucumberMultipartDocString;
    rows?: CucumberMultipartDataTableRow[];
}
export interface CucumberMultipartDocString {
    line: number;
    value: string;
    content_type?: string;
}
export interface CucumberMultipartDataTableRow {
    cells: string[];
}
export interface CucumberMultipartTag {
    name: string;
    line?: number;
}
