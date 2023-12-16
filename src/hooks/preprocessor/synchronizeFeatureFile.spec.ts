import { expect } from "chai";
import path from "path";
import {
    getMockedJiraClient,
    getMockedJiraRepository,
    getMockedXrayClient,
} from "../../../test/mocks";
import { stubLogging } from "../../../test/util";
import { IXrayClient } from "../../client/xray/xrayClient";
import {
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../context";
import { ClientCombination, InternalOptions } from "../../types/plugin";
import { ImportFeatureResponse } from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { importKnownFeature, synchronizeFeatureFile } from "./synchronizeFeatureFile";

describe("synchronizeFeatureFile", () => {
    let options: InternalOptions;
    let clients: ClientCombination;

    beforeEach(() => {
        options = {
            jira: initJiraOptions(
                {},
                {
                    projectKey: "CYP",
                    url: "https://example.org",
                }
            ),
            xray: initXrayOptions(
                {},
                {
                    uploadResults: true,
                }
            ),
            plugin: initPluginOptions({}, {}),
            openSSL: initOpenSSLOptions({}, {}),
        };
        clients = {
            kind: "server",
            jiraClient: getMockedJiraClient(),
            xrayClient: getMockedXrayClient(),
            jiraRepository: getMockedJiraRepository(),
        };
    });
    const file: Cypress.FileObject = {
        // Weird workaround.
        ...({} as Cypress.FileObject),
        filePath: "./test/resources/features/taggedCloud.feature",
        outputPath: "",
        shouldWatch: false,
    };

    it("should display errors for invalid feature files", async () => {
        file.filePath = "./test/resources/features/invalid.feature";
        const { stubbedInfo, stubbedError } = stubLogging();
        options.cucumber = {
            featureFileExtension: ".feature",
            downloadFeatures: false,
            uploadFeatures: true,
            prefixes: {},
        };
        await synchronizeFeatureFile(file, ".", options, clients);
        expect(stubbedError).to.have.been.calledOnce;
        expect(stubbedError).to.have.been.calledWith(
            dedent(`
                Feature file invalid, skipping synchronization: ./test/resources/features/invalid.feature

                Parser errors:
                (9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'
            `)
        );
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            `Preprocessing feature file ${path.join(
                "test",
                "resources",
                "features",
                "invalid.feature"
            )}...`
        );
    });

    it("resets updated issues only", async () => {
        file.filePath = "./test/resources/features/invalid.feature";
        const { stubbedInfo, stubbedError } = stubLogging();
        options.cucumber = {
            featureFileExtension: ".feature",
            downloadFeatures: false,
            uploadFeatures: true,
            prefixes: {},
        };
        await synchronizeFeatureFile(file, ".", options, clients);
        expect(stubbedError).to.have.been.calledOnce;
        expect(stubbedError).to.have.been.calledWith(
            dedent(`
                Feature file invalid, skipping synchronization: ./test/resources/features/invalid.feature

                Parser errors:
                (9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'
            `)
        );
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            `Preprocessing feature file ${path.join(
                "test",
                "resources",
                "features",
                "invalid.feature"
            )}...`
        );
    });

    it("should not try to parse mismatched feature files", async () => {
        file.filePath = "./test/resources/greetings.txt";
        const { stubbedError } = stubLogging();
        await synchronizeFeatureFile(file, ".", options, clients);
        expect(stubbedError).to.not.have.been.called;
    });
});

describe("importKnownFeature", () => {
    let mockedXrayClient: IXrayClient;
    beforeEach(() => {
        mockedXrayClient = getMockedXrayClient();
    });

    it("returns updated issue keys", async () => {
        const { stubbedWarning } = stubLogging();
        mockedXrayClient.importFeature = async function (): Promise<
            ImportFeatureResponse | undefined
        > {
            return {
                errors: [],
                updatedOrCreatedIssues: ["CYP-123", "CYP-756", "CYP-42"],
            };
        };
        const updatedIssues = await importKnownFeature(
            "/path/to/some.feature",
            "CYP",
            ["CYP-123", "CYP-756", "CYP-42"],
            mockedXrayClient
        );
        expect(updatedIssues).to.deep.eq(["CYP-123", "CYP-756", "CYP-42"]);
        expect(stubbedWarning).to.not.have.been.called;
    });

    it("warns about import errors", async () => {
        const { stubbedWarning } = stubLogging();
        mockedXrayClient.importFeature = async function (): Promise<
            ImportFeatureResponse | undefined
        > {
            return {
                errors: ["CYP-123 does not exist", "CYP-42: Access denied", "Big\nProblem"],
                updatedOrCreatedIssues: [],
            };
        };
        await importKnownFeature(
            "/path/to/some.feature",
            "CYP",
            ["CYP-123", "CYP-756", "CYP-42"],
            mockedXrayClient
        );
        expect(stubbedWarning).to.have.been.calledWithExactly(
            dedent(`
              Encountered errors during feature file import:
              - CYP-123 does not exist
              - CYP-42: Access denied
              - Big\nProblem
            `)
        );
    });

    it("warns about issue key mismatches", async () => {
        const { stubbedWarning } = stubLogging();
        mockedXrayClient.importFeature = async function (): Promise<ImportFeatureResponse> {
            return {
                errors: [],
                updatedOrCreatedIssues: ["CYP-536", "CYP-552", "CYP-756"],
            };
        };
        await importKnownFeature(
            "/path/to/some.feature",
            "CYP",
            ["CYP-123", "CYP-756", "CYP-42"],
            mockedXrayClient
        );
        expect(stubbedWarning).to.have.been.calledWithExactly(
            dedent(`
                Mismatch between feature file issue tags and updated Jira issues detected

                Issues contained in feature file tags which were not updated by Jira and might not exist:
                  CYP-123
                  CYP-42
                Issues updated by Jira which are not present in feature file tags and might have been created:
                  CYP-536
                  CYP-552

                Make sure that:
                - All issues present in feature file tags belong to existing issues
                - Your plugin tag prefix settings are consistent with the ones defined in Xray

                More information:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
            `)
        );
    });

    it("does not do anything if the import fails", async () => {
        const { stubbedWarning } = stubLogging();
        mockedXrayClient.importFeature = async function (): Promise<undefined> {
            return undefined;
        };
        expect(
            await importKnownFeature(
                "/path/to/some.feature",
                "CYP",
                ["CYP-123", "CYP-756", "CYP-42"],
                mockedXrayClient
            )
        ).to.be.undefined;
        expect(stubbedWarning).to.not.have.been.called;
    });
});
