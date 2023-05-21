/// <reference types="cypress" />
import { expect } from "chai";

import { BasicAuthCredentials, PATCredentials } from "../../../src/authentication/credentials";
import { XrayClientCloud } from "../../../src/client/xray/xrayClientCloud";
import { XrayClientServer } from "../../../src/client/xray/xrayClientServer";
import { CONTEXT, initContext } from "../../../src/context";
import {
    initJiraClient,
    initXrayClient,
    parseEnvironmentVariables,
} from "../../../src/util/config";
import { stubLogInfo } from "../../constants";
import { expectToExist } from "../helpers";

describe("the environment variable configuration parser", () => {
    let env: Cypress.ObjectLike;
    beforeEach(() => {
        initContext({
            jira: {
                projectKey: "CYP",
            },
        });
        env = {};
    });

    describe("should be able to parse Jira options", () => {
        it("JIRA_PROJECT_KEY", () => {
            env = {
                JIRA_PROJECT_KEY: "ABC",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.jira.projectKey).to.eq("ABC");
        });

        it("JIRA_ATTACH_VIDEOS", () => {
            env = {
                JIRA_ATTACH_VIDEOS: "true",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.jira.attachVideos).to.be.true;
        });

        it("JIRA_CREATE_TEST_ISSUES", () => {
            env = {
                JIRA_CREATE_TEST_ISSUES: "true",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.jira.createTestIssues).to.be.true;
        });

        it("JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION", () => {
            env = {
                JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION: "Good morning",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.jira.testExecutionIssueDescription).to.eq("Good morning");
        });

        it("JIRA_TEST_EXECUTION_ISSUE_KEY", () => {
            env = {
                JIRA_TEST_EXECUTION_ISSUE_KEY: "CYP-123",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.jira.testExecutionIssueKey).to.eq("CYP-123");
        });

        it("JIRA_TEST_EXECUTION_ISSUE_SUMMARY", () => {
            env = {
                JIRA_TEST_EXECUTION_ISSUE_SUMMARY: "Some test case",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.jira.testExecutionIssueSummary).to.eq("Some test case");
        });

        it("JIRA_TEST_PLAN_ISSUE_KEY", () => {
            env = {
                JIRA_TEST_PLAN_ISSUE_KEY: "CYP-456",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.jira.testPlanIssueKey).to.eq("CYP-456");
        });

        it("JIRA_URL", () => {
            env = {
                JIRA_URL: "https://example.org",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.jira.url).to.eq("https://example.org");
        });
    });

    describe("should be able to parse Xray options", () => {
        it("XRAY_STATUS_FAILED", () => {
            env = {
                XRAY_STATUS_FAILED: "no",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.statusFailed).to.eq("no");
        });

        it("XRAY_STATUS_PASSED", () => {
            env = {
                XRAY_STATUS_PASSED: "ok",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.statusPassed).to.eq("ok");
        });

        it("XRAY_STATUS_PENDING", () => {
            env = {
                XRAY_STATUS_PENDING: "pendulum",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.statusPending).to.eq("pendulum");
        });

        it("XRAY_STATUS_SKIPPED", () => {
            env = {
                XRAY_STATUS_SKIPPED: "ski-ba-bop-ba-dop-bop",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.statusSkipped).to.eq("ski-ba-bop-ba-dop-bop");
        });

        it("XRAY_STEPS_MAX_LENGTH_ACTION", () => {
            env = {
                XRAY_STEPS_MAX_LENGTH_ACTION: "12345",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.steps?.maxLengthAction).to.eq(12345);
        });

        it("XRAY_STEPS_UPDATE", () => {
            env = {
                XRAY_STEPS_UPDATE: "false",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.steps?.update).to.be.false;
        });

        it("XRAY_TEST_TYPE", () => {
            env = {
                XRAY_TEST_TYPE: "Automated",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.testType).to.eq("Automated");
        });

        it("XRAY_UPLOAD_RESULTS", () => {
            env = {
                XRAY_UPLOAD_RESULTS: "false",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.uploadResults).to.be.false;
        });

        it("XRAY_UPLOAD_SCREENSHOTS", () => {
            env = {
                XRAY_UPLOAD_SCREENSHOTS: "true",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.xray?.uploadScreenshots).to.be.true;
        });
    });

    describe("should be able to parse Cucumber options", () => {
        it("CUCUMBER_FEATURE_FILE_EXTENSION", () => {
            env = {
                CUCUMBER_FEATURE_FILE_EXTENSION: ".feature.file",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.cucumber.featureFileExtension).to.eq(".feature.file");
        });

        it("CUCUMBER_DOWNLOAD_FEATURES", () => {
            env = {
                CUCUMBER_DOWNLOAD_FEATURES: "true",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.cucumber?.downloadFeatures).to.be.true;
        });

        it("CUCUMBER_UPLOAD_FEATURES", () => {
            env = {
                CUCUMBER_UPLOAD_FEATURES: "false",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.cucumber?.downloadFeatures).to.be.false;
        });
    });

    describe("should be able to parse Plugin options", () => {
        it("PLUGIN_DEBUG", () => {
            env = {
                PLUGIN_DEBUG: "false",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.plugin?.debug).to.be.false;
        });

        it("PLUGIN_NORMALIZE_SCREENSHOT_NAMES", () => {
            env = {
                PLUGIN_NORMALIZE_SCREENSHOT_NAMES: "false",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.plugin?.normalizeScreenshotNames).to.be.false;
        });

        it("PLUGIN_OVERWRITE_ISSUE_SUMMARY", () => {
            env = {
                PLUGIN_OVERWRITE_ISSUE_SUMMARY: "true",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.plugin?.overwriteIssueSummary).to.be.true;
        });
    });

    describe("should be able to parse OpenSSL options", () => {
        it("OPENSSL_ROOT_CA_PATH ", () => {
            env = {
                OPENSSL_ROOT_CA_PATH: "/home/ssl/ca.pem",
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.openSSL?.rootCAPath).to.eq("/home/ssl/ca.pem");
        });

        it("OPENSSL_SECURE_OPTIONS ", () => {
            env = {
                OPENSSL_SECURE_OPTIONS: 415,
            };
            parseEnvironmentVariables(env);
            expect(CONTEXT.config.openSSL?.secureOptions).to.eq(415);
        });
    });
});

describe("the Jira client instantiation", () => {
    let env: Cypress.ObjectLike;
    beforeEach(() => {
        initContext({
            jira: {
                projectKey: "CYP",
            },
        });
        CONTEXT.config.jira.url = "https://example.org";
        // Make Jira client instantiation mandatory.
        CONTEXT.config.jira.attachVideos = true;
        env = {};
    });

    it("should be able to detect Jira cloud credentials", () => {
        env = {
            JIRA_USERNAME: "user@somewhere.xyz",
            JIRA_API_TOKEN: "1337",
        };
        const stubbedInfo = stubLogInfo();
        initJiraClient(env);
        expectToExist(CONTEXT.jiraClient);
        const credentials = CONTEXT.jiraClient.getCredentials();
        expect(credentials).to.be.an.instanceof(BasicAuthCredentials);
        expect(stubbedInfo).to.have.been.calledWith(
            "Jira username and API token found. Setting up basic auth credentials for Jira cloud."
        );
    });

    it("should be able to detect Jira server PAT credentials", () => {
        env = {
            JIRA_API_TOKEN: "1337",
        };
        const stubbedInfo = stubLogInfo();
        initJiraClient(env);
        expectToExist(CONTEXT.jiraClient);
        const credentials = CONTEXT.jiraClient.getCredentials();
        expect(credentials).to.be.an.instanceof(PATCredentials);
        expect(stubbedInfo).to.have.been.calledWith(
            "Jira PAT found. Setting up PAT credentials for Jira server."
        );
    });

    it("should be able to detect Jira server basic auth credentials", () => {
        env = {
            JIRA_USERNAME: "user",
            JIRA_PASSWORD: "1337",
        };
        const stubbedInfo = stubLogInfo();
        initJiraClient(env);
        expectToExist(CONTEXT.jiraClient);
        const credentials = CONTEXT.jiraClient.getCredentials();
        expect(credentials).to.be.an.instanceof(BasicAuthCredentials);
        expect(stubbedInfo).to.have.been.calledWith(
            "Jira username and password found. Setting up basic auth credentials for Jira server."
        );
    });

    it("should be able to choose Jira cloud credentials over server credentials", () => {
        env = {
            JIRA_USERNAME: "user",
            JIRA_PASSWORD: "xyz",
            JIRA_API_TOKEN: "1337",
        };
        const stubbedInfo = stubLogInfo();
        initJiraClient(env);
        expectToExist(CONTEXT.jiraClient);
        const credentials = CONTEXT.jiraClient.getCredentials();
        expect(credentials).to.be.an.instanceof(BasicAuthCredentials);
        expect(stubbedInfo).to.have.been.calledWith(
            "Jira username and API token found. Setting up basic auth credentials for Jira cloud."
        );
    });

    describe("the error handling", () => {
        beforeEach(() => {
            // We're not interested in informative log messages here.
            stubLogInfo();
        });

        it("should throw an error for missing Jira URLs", () => {
            CONTEXT.config.jira.url = undefined;
            expect(() => initJiraClient(env)).to.throw(
                "Failed to configure Jira client: no Jira URL was provided. Configured options which necessarily require a configured Jira client:\n[\n\tjira.attachVideos = true\n]"
            );
        });

        it("should throw an error for missing credentials", () => {
            expect(() => initJiraClient(env)).to.throw(
                "Failed to configure Jira client: no viable authentication method was configured.\nYou can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
            );
        });
    });
});

describe("the Xray client instantiation", () => {
    let env: Cypress.ObjectLike;
    beforeEach(() => {
        initContext({
            jira: {
                projectKey: "CYP",
            },
        });
        env = {};
    });

    it("should be able to detect cloud credentials", () => {
        env = {
            XRAY_CLIENT_ID: "user",
            XRAY_CLIENT_SECRET: "xyz",
        };
        const stubbedInfo = stubLogInfo();
        initXrayClient(env);
        expect(CONTEXT.xrayClient).to.be.an.instanceof(XrayClientCloud);
        expect(stubbedInfo).to.have.been.calledWith(
            "Xray client ID and client secret found. Setting up Xray cloud credentials."
        );
    });

    it("should be able to detect basic server credentials", () => {
        env = {
            JIRA_USERNAME: "user",
            JIRA_PASSWORD: "xyz",
        };
        CONTEXT.config.jira.url = "https://example.org";
        const stubbedInfo = stubLogInfo();
        initXrayClient(env);
        expect(CONTEXT.xrayClient).to.be.an.instanceof(XrayClientServer);
        expect(stubbedInfo).to.have.been.calledWith(
            "Jira username and password found. Setting up Xray basic auth credentials."
        );
    });

    it("should be able to detect PAT server credentials", () => {
        env = {
            JIRA_API_TOKEN: "1337",
        };
        CONTEXT.config.jira.url = "https://example.org";
        const stubbedInfo = stubLogInfo();
        initXrayClient(env);
        expect(CONTEXT.xrayClient).to.be.an.instanceof(XrayClientServer);
        expect(stubbedInfo).to.have.been.calledWith(
            "Jira PAT found. Setting up Xray PAT credentials."
        );
    });

    it("should be able to choose cloud credentials over server credentials", () => {
        env = {
            JIRA_USERNAME: "user",
            JIRA_API_TOKEN: "1337",
            JIRA_PASSWORD: "xyz",
            XRAY_CLIENT_ID: "id",
            XRAY_CLIENT_SECRET: "secret",
        };
        const stubbedInfo = stubLogInfo();
        initXrayClient(env);
        expect(CONTEXT.xrayClient).to.be.an.instanceof(XrayClientCloud);
        expect(stubbedInfo).to.have.been.calledWith(
            "Xray client ID and client secret found. Setting up Xray cloud credentials."
        );
    });

    it("should throw an error for missing credentials", () => {
        expect(() => initXrayClient(env)).to.throw(
            "Failed to configure Xray uploader: no viable Xray configuration was found or the configuration you provided is not supported.\nYou can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
        );
    });
});
