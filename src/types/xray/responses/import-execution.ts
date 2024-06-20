/**
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST
 */
export interface ImportExecutionResponseServer {
    testExecIssue: {
        id: string;
        key: string;
        name: string;
    };
}
/**
 * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST
 */
export interface ImportExecutionResponseCloud {
    id: string;
    key: string;
    self: string;
}
