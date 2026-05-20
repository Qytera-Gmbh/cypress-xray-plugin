import type { MultipartInfo } from "./import-execution-multipart-info";

/*
 * There unfortunately is no official Cucumber JSON report scheme available anywhere, as stated
 * here: https://github.com/cucumber/messages#lack-of-a-schema
 *
 * Therefore, the types in here are a mix of the following sources:
 * - https://github.com/cucumber/cucumber-js/blob/main/src/formatter/json_formatter.ts
 * - https://github.com/cucumber/json-formatter/blob/main/go/json_elements.go
 * - https://github.com/cucumber/cucumber-json-converter/blob/main/src/CucumberJson.ts
 */

export interface CucumberMultipart {
    features: CucumberMultipartFeature[];
    info: MultipartInfo;
}
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
    after?: CucumberMultipartHook[];
    before?: CucumberMultipartHook[];
    description: string;
    id?: string;
    keyword: string;
    line: number;
    name: string;
    steps: CucumberMultipartStep[];
    tags?: CucumberMultipartTag[];
    type: "background" | "scenario";
}
export interface CucumberMultipartStep {
    ["doc_string"]?: CucumberMultipartDocString;
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
    ["content_type"]: string;
    line: number;
    value: string;
}
export interface CucumberMultipartDataTableRow {
    cells: string[];
}
export interface CucumberMultipartStepResult {
    duration?: number;
    ["error_message"]?: string;
    status: string;
}
export interface CucumberMultipartMatch {
    arguments?: CucumberMultipartArgument[];
    location: string;
}
export interface CucumberMultipartTag {
    line?: number;
    name: string;
}
export interface CucumberMultipartHook {
    match?: CucumberMultipartMatch;
    result: CucumberMultipartStepResult;
}
export interface CucumberMultipartArgument {
    offset: number;
    value: string;
}
export interface CucumberMultipartEmbedding {
    data: string;
    ["mime_type"]: string;
}
