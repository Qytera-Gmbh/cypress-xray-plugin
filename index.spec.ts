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

    it("addXrayResultUpload", () => {
        expect(syncFeatureFile).to.be.a("function");
    });

    describe("CypressXrayPluginOptions", () => {
        it("default", () => {
            const options: CypressXrayPluginOptions = {
                jira: undefined,
            };
            expect(options).to.exist;
        });
        it("jira", () => {
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "CYP-123",
                    url: "https://example.org",
                },
            };
            expect(options).to.exist;
        });
        it("xray", () => {
            const options: CypressXrayPluginOptions = {
                jira: undefined,
                xray: {},
            };
            expect(options).to.exist;
        });
        it("cucumber", () => {
            const options: CypressXrayPluginOptions = {
                jira: undefined,
                cucumber: {
                    featureFileExtension: ".feature",
                },
            };
            expect(options).to.exist;
        });
        it("plugin", () => {
            const options: CypressXrayPluginOptions = {
                jira: undefined,
                plugin: {},
            };
            expect(options).to.exist;
        });
        it("openSSL", () => {
            const options: CypressXrayPluginOptions = {
                jira: undefined,
                openSSL: {},
            };
            expect(options).to.exist;
        });
    });
});
