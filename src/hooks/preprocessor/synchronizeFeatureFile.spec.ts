import { expect } from "chai";
import path from "path";
import { SinonStubbedInstance } from "sinon";
import {
    getMockedJiraClient,
    getMockedJiraRepository,
    getMockedLogger,
    getMockedXrayClient,
} from "../../../test/mocks";
import { JiraClient } from "../../client/jira/jiraClient";
import { XrayClient } from "../../client/xray/xrayClient";
import { initJiraOptions, initPluginOptions, initXrayOptions } from "../../context";
import { Level } from "../../logging/logging";
import { SupportedFields } from "../../repository/jira/fields/jiraIssueFetcher";
import { JiraRepository } from "../../repository/jira/jiraRepository";
import { InternalOptions } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { importKnownFeature, synchronizeFeatureFile } from "./synchronizeFeatureFile";

describe("synchronizeFeatureFile", () => {
    let file: Cypress.FileObject;
    let options: InternalOptions;
    let jiraClient: SinonStubbedInstance<JiraClient>;
    let xrayClient: SinonStubbedInstance<XrayClient>;
    let jiraRepository: SinonStubbedInstance<JiraRepository>;

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
        };
        jiraClient = getMockedJiraClient();
        xrayClient = getMockedXrayClient();
        jiraRepository = getMockedJiraRepository();
        file = {
            // Weird workaround.
            ...({} as Cypress.FileObject),
            filePath: "./test/resources/features/taggedCloud.feature",
            outputPath: "",
            shouldWatch: false,
        };
    });

    it("should display errors for invalid feature files", async () => {
        file.filePath = "./test/resources/features/invalid.feature";
        const logger = getMockedLogger();
        options.cucumber = {
            featureFileExtension: ".feature",
            downloadFeatures: false,
            uploadFeatures: true,
            prefixes: {},
        };
        logger.message
            .withArgs(
                Level.ERROR,
                dedent(`
                    Feature file invalid, skipping synchronization: ./test/resources/features/invalid.feature

                    Parser errors:
                    (9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'
                `)
            )
            .onFirstCall()
            .returns();
        logger.message
            .withArgs(
                Level.INFO,
                `Preprocessing feature file ${path.join(
                    "test",
                    "resources",
                    "features",
                    "invalid.feature"
                )}...`
            )
            .onFirstCall()
            .returns();
        await synchronizeFeatureFile(file, ".", options, {
            kind: "server",
            jiraClient: jiraClient,
            jiraRepository: jiraRepository,
            xrayClient: xrayClient,
        });
    });

    it("resets updated issues only", async () => {
        file.filePath = "./test/resources/features/taggedPrefixCorrect.feature";
        getMockedLogger({ allowUnstubbedCalls: true });
        options.cucumber = {
            featureFileExtension: ".feature",
            downloadFeatures: false,
            uploadFeatures: true,
            prefixes: { test: "TestName:", precondition: "Precondition:" },
        };
        jiraRepository.getSummaries.resolves({
            ["CYP-222"]: "Big",
            ["CYP-333"]: "Backup",
            ["CYP-555"]: "Yo",
        });
        jiraRepository.getLabels.resolves({
            ["CYP-222"]: ["Some"],
            ["CYP-333"]: ["Labels", "Here"],
            ["CYP-555"]: [],
        });
        xrayClient.importFeature.resolves({
            errors: [],
            updatedOrCreatedIssues: ["CYP-222", "CYP-555"],
        });
        jiraRepository.getFieldId.withArgs(SupportedFields.SUMMARY).resolves("summary");
        jiraRepository.getFieldId.withArgs(SupportedFields.LABELS).resolves("label");
        jiraClient.editIssue
            .withArgs("CYP-222", { fields: { summary: "Big" } })
            .resolves("CYP-222");
        jiraClient.editIssue.withArgs("CYP-555", { fields: { summary: "Yo" } }).resolves("CYP-555");
        jiraClient.editIssue
            .withArgs("CYP-222", { fields: { label: ["Some"] } })
            .resolves("CYP-222");
        jiraClient.editIssue.withArgs("CYP-555", { fields: { label: [] } }).resolves("CYP-555");
        await synchronizeFeatureFile(file, ".", options, {
            kind: "cloud",
            jiraClient: jiraClient,
            jiraRepository: jiraRepository,
            xrayClient: xrayClient,
        });
    });

    it("should not try to parse mismatched feature files", async () => {
        file.filePath = "./test/resources/greetings.txt";
        const logger = getMockedLogger();
        await synchronizeFeatureFile(file, ".", options, {
            kind: "server",
            jiraClient: jiraClient,
            jiraRepository: jiraRepository,
            xrayClient: xrayClient,
        });
        expect(logger.message).to.not.have.been.called;
    });
});

describe("importKnownFeature", () => {
    let xrayClient: SinonStubbedInstance<XrayClient>;
    beforeEach(() => {
        xrayClient = getMockedXrayClient();
    });

    it("returns updated issue keys", async () => {
        const logger = getMockedLogger();
        xrayClient.importFeature.resolves({
            errors: [],
            updatedOrCreatedIssues: ["CYP-123", "CYP-756", "CYP-42"],
        });
        const updatedIssues = await importKnownFeature(
            "/path/to/some.feature",
            "CYP",
            ["CYP-123", "CYP-756", "CYP-42"],
            xrayClient
        );
        expect(updatedIssues).to.deep.eq(["CYP-123", "CYP-756", "CYP-42"]);
        expect(logger.message).to.not.have.been.called;
    });

    it("warns about import errors", async () => {
        const logger = getMockedLogger({ allowUnstubbedCalls: true });
        xrayClient.importFeature.resolves({
            errors: ["CYP-123 does not exist", "CYP-42: Access denied", "Big\nProblem"],
            updatedOrCreatedIssues: [],
        });
        await importKnownFeature(
            "/path/to/some.feature",
            "CYP",
            ["CYP-123", "CYP-756", "CYP-42"],
            xrayClient
        );
        expect(logger.message).to.have.been.calledWithExactly(
            Level.WARNING,
            dedent(`
                Encountered errors during feature file import:
                - CYP-123 does not exist
                - CYP-42: Access denied
                - Big\nProblem
            `)
        );
    });

    it("warns about issue key mismatches", async () => {
        const logger = getMockedLogger();
        xrayClient.importFeature.resolves({
            errors: [],
            updatedOrCreatedIssues: ["CYP-536", "CYP-552", "CYP-756"],
        });
        logger.message
            .withArgs(
                Level.WARNING,
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
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                `)
            )
            .onFirstCall()
            .returns();
        await importKnownFeature(
            "/path/to/some.feature",
            "CYP",
            ["CYP-123", "CYP-756", "CYP-42"],
            xrayClient
        );
    });

    it("does not do anything if the import fails", async () => {
        const logger = getMockedLogger();
        xrayClient.importFeature.rejects(new Error("Oh no"));
        await expect(
            importKnownFeature(
                "/path/to/some.feature",
                "CYP",
                ["CYP-123", "CYP-756", "CYP-42"],
                xrayClient
            )
        ).to.eventually.be.rejectedWith("Oh no");
        expect(logger.message).to.not.have.been.called;
    });
});
