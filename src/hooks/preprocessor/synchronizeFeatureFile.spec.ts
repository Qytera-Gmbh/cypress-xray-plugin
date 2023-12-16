import { expect } from "chai";
import path from "path";
import { stubLogging } from "../../../test/util";
import { PATCredentials } from "../../authentication/credentials";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import {
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../context";
import { CachingJiraFieldRepository } from "../../repository/jira/fields/jiraFieldRepository";
import { JiraIssueFetcher } from "../../repository/jira/fields/jiraIssueFetcher";
import { CachingJiraRepository } from "../../repository/jira/jiraRepository";
import { ClientCombination, InternalOptions } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { synchronizeFeatureFile } from "./synchronizeFeatureFile";

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
        const jiraClient = new JiraClientServer("https://example.org", new PATCredentials("token"));
        const xrayClient = new XrayClientServer("https://example.org", new PATCredentials("token"));
        const jiraFieldRepository = new CachingJiraFieldRepository(jiraClient);
        const jiraFieldFetcher = new JiraIssueFetcher(
            jiraClient,
            jiraFieldRepository,
            options.jira.fields
        );
        clients = {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
            jiraRepository: new CachingJiraRepository(jiraFieldRepository, jiraFieldFetcher),
        };
    });
    // Weird workaround.
    const emitter = {} as Cypress.FileObject;
    const file: Cypress.FileObject = {
        ...emitter,
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

    it("should not try to parse mismatched feature files", async () => {
        file.filePath = "./test/resources/greetings.txt";
        const { stubbedError } = stubLogging();
        await synchronizeFeatureFile(file, ".", options, clients);
        expect(stubbedError).to.not.have.been.called;
    });
});
