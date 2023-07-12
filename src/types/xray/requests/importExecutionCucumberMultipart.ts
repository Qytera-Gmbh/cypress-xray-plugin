export type CucumberMultipart = Feature[];
export interface Feature {
    uri: string;
    id?: string;
    line?: number;
    keyword: string;
    name: string;
    description?: string;
    elements: Element[];
    tags?: Tag[];
}
export interface Element {
    start_timestamp?: string;
    line: number;
    id?: string;
    type: "background" | "scenario";
    keyword: string;
    name: string;
    description: string;
    before?: Hook[];
    steps: Step[];
    after?: Hook[];
    tags?: Tag[];
}
export interface Hook {
    match?: Match;
    result: Result;
}
export interface Match {
    location?: string;
    arguments?: Argument[];
}
export interface Argument {
    value: string;
    offset: number;
}
export interface Result {
    duration?: number;
    status: "passed" | "failed" | "skipped" | "undefined" | "pending" | "unknown";
    error_message?: string;
}
export interface Step {
    keyword: string;
    line: number;
    match?: Match;
    name: string;
    result: Result;
    doc_string?: DocString;
    rows?: DataTableRow[];
}
export interface DocString {
    line: number;
    value: string;
    content_type?: string;
}
export interface DataTableRow {
    cells: string[];
}
export interface Tag {
    name: string;
    line?: number;
}
