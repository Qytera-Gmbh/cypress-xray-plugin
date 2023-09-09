import { Remap } from "../../../util";
import { Test, TestType } from "../../responses/graphql/xray";

export type AdditionalResultsArguments = {
    testType: Remap<TestType, boolean>;
};
type GetTestsJiraData = {
    key: string;
};

const x: AdditionalResultsArguments = {
    testType: {},
};

export type Bla = Remap<Test<GetTestsJiraData>, boolean>;
