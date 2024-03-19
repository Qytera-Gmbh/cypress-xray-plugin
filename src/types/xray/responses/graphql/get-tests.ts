import { TestResults } from "./xray";

/**
 * @see https://xray.cloud.getxray.app/doc/graphql/gettests.doc.html
 * @see https://xray.cloud.getxray.app/doc/graphql/testresults.doc.html
 */
export interface GetTestsResponse<JiraDataType> {
    data: {
        getTests: TestResults<JiraDataType>;
    };
}
