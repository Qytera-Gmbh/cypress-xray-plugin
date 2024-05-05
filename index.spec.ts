import { expect } from "chai";
import {
    CypressXrayPluginOptions,
    addXrayResultUpload,
    configureXrayPlugin,
    syncFeatureFile,
} from "./index";

// Make sure there are no accidental breaking changes for the plugin's exported members.
// If there were, the compiler would complain about these tests.
// These tests therefore somewhat simulate a real use case.
describe("the plugin exports should work", () => {
    it("addXrayResultUpload", () => {
        expect(addXrayResultUpload).to.be.a("function");
    });

    it("configureXrayPlugin", () => {
        expect(configureXrayPlugin).to.be.a("function");
    });

    it("syncFeatureFile", () => {
        expect(syncFeatureFile).to.be.a("function");
    });

    describe("CypressXrayPluginOptions", () => {
        it("jira", () => {
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "CYP-123",
                    url: "https://example.org",
                },
            };
            expect(options.jira).to.exist;
        });
        it("xray", () => {
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "CYP-123",
                    url: "https://example.org",
                },
                xray: {},
            };
            expect(options.xray).to.exist;
        });
        it("cucumber", () => {
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "CYP-123",
                    url: "https://example.org",
                },
                cucumber: {
                    featureFileExtension: ".feature",
                },
            };
            expect(options.cucumber).to.exist;
        });
        it("plugin", () => {
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "CYP-123",
                    url: "https://example.org",
                },
                plugin: {},
            };
            expect(options.plugin).to.exist;
        });
        it("http", () => {
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "CYP-123",
                    url: "https://example.org",
                },
                http: {},
            };
            expect(options.http).to.exist;
        });
    });
});
