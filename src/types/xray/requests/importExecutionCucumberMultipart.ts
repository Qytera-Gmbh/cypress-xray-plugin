import {
    CucumberMultipartInfoCloud,
    CucumberMultipartInfoServer,
} from "./importExecutionCucumberMultipartInfo";

/*
 * There is unfortunately no official Cucumber JSON report scheme available anywhere, as stated
 * here: https://github.com/cucumber/messages#lack-of-a-schema
 *
 * Therefore, the types in here are a mix of the following sources:
 * - https://github.com/cucumber/cucumber-js/blob/main/src/formatter/json_formatter.ts
 * - https://github.com/cucumber/json-formatter/blob/main/go/json_elements.go
 * - https://github.com/cucumber/cucumber-json-converter/blob/main/src/CucumberJson.ts
 */

export type CucumberMultipart<CucumberMultipartInfoType> = {
    features: CucumberMultipartFeature[];
    info: CucumberMultipartInfoType;
};
export type CucumberMultipartServer = CucumberMultipart<CucumberMultipartInfoServer>;
export type CucumberMultipartCloud = CucumberMultipart<CucumberMultipartInfoCloud>;
export interface CucumberMultipartFeature {
    description: string;
    elements: CucumberMultipartElement[];
    id: string;
    keyword: string;
    line: number;
    name: string;
    tags?: CucumberMultipartTag[];
    uri: string;
}
export interface CucumberMultipartElement {
    description: string;
    id?: string;
    keyword: string;
    line: number;
    name: string;
    before?: CucumberMultipartHook[];
    steps: CucumberMultipartStep[];
    after?: CucumberMultipartHook[];
    type: "background" | "scenario";
    tags?: CucumberMultipartTag[];
}
export interface CucumberMultipartStep {
    doc_string?: CucumberMultipartDocString;
    embeddings?: CucumberMultipartEmbedding[];
    keyword: string;
    line: number;
    match?: CucumberMultipartMatch;
    name: string;
    output?: string;
    result: CucumberMultipartStepResult;
    rows?: CucumberMultipartDataTableRow[];
}
export interface CucumberMultipartDocString {
    content_type: string;
    line: number;
    value: string;
}
export interface CucumberMultipartDataTableRow {
    cells: string[];
}
export interface CucumberMultipartStepResult {
    duration?: number;
    status: "passed" | "failed" | "skipped" | "undefined" | "pending" | "unknown";
    error_message?: string;
}
export interface CucumberMultipartMatch {
    location: string;
    arguments?: CucumberMultipartArgument[];
}
export interface CucumberMultipartTag {
    name: string;
    line?: number;
}
export interface CucumberMultipartHook {
    match?: CucumberMultipartMatch;
    result: CucumberMultipartStepResult;
}
export interface CucumberMultipartArgument {
    value: string;
    offset: number;
}
export interface CucumberMultipartEmbedding {
    data: string;
    mime_type: string;
}
