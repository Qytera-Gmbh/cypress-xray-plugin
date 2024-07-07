import { expect } from "chai";
import fs from "fs";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { expectToExist } from "../../../../../../test/util";
import { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { dedent } from "../../../../../util/dedent";
import { Level } from "../../../../../util/logging";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { ConvertCucumberFeaturesCommand } from "./convert-cucumber-features-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConvertCucumberFeaturesCommand.name, () => {
        it("converts cucumber results into cucumber features data", async () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { precondition: undefined, test: undefined } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport.slice(0, 1))
            );
            const features = await command.compute();
            expect(features).to.be.an("array").with.length(1);
        });

        it("returns parameters", () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { precondition: undefined, test: undefined } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport.slice(0, 1))
            );
            expect(command.getParameters()).to.deep.eq({
                cucumber: {
                    prefixes: {
                        precondition: undefined,
                        test: undefined,
                    },
                },
                jira: {
                    projectKey: "CYP",
                },
                projectRoot: "./test/resources",
                xray: { status: {}, uploadScreenshots: false },
            });
        });

        it("converts cucumber results into cloud cucumber features data", async () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport.slice(0, 1))
            );
            const features = await command.compute();
            expect(features).to.be.an("array").with.length(1);
        });

        it("includes all tagged features and tests", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const logger = getMockedLogger();
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport)
            );
            const features = await command.compute();
            expect(features).to.be.an("array").with.length(2);
            expect(features[0].elements).to.be.an("array").with.length(3);
            expect(features[1].elements).to.be.an("array").with.length(1);
        });

        it("uses the configured test execution issue key", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const logger = getMockedLogger();
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport),
                new ConstantCommand(logger, "CYP-456")
            );
            const features = await command.compute();
            expect(features[0].tags).to.deep.eq([{ name: "@CYP-456" }]);
            expect(features[1].tags).to.deep.eq([{ name: "@CYP-456" }]);
        });

        it("uses the configured test execution issue key even without existing tags", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            delete cucumberReport[0].tags;
            const logger = getMockedLogger();
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport),
                new ConstantCommand(logger, "CYP-456")
            );
            const features = await command.compute();
            expect(features[0].tags).to.deep.eq([{ name: "@CYP-456" }]);
        });

        it("includes screenshots if enabled", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const logger = getMockedLogger();
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { status: {}, uploadScreenshots: true },
                },
                logger,
                new ConstantCommand(logger, cucumberReport)
            );
            const features = await command.compute();
            expectToExist(features[0].elements[2].steps[1].embeddings);
            expect(features[0].elements[2].steps[1].embeddings).to.have.length(1);
            expect(features[0].elements[2].steps[1].embeddings[0].data).to.be.a("string");
            expect(features[0].elements[2].steps[1].embeddings[0].mime_type).to.eq("image/png");
        });

        it("respects custom statuses", async () => {
            const logger = getMockedLogger();
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: {
                        status: {
                            step: {
                                failed: "DID FAIL",
                                passed: "DID PASS",
                                pending: "IS PENDING",
                                skipped: "WAS SKIPPED",
                            },
                        },
                        uploadScreenshots: false,
                    },
                },
                logger,
                new ConstantCommand(logger, [
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "a-tagged-feature;tc---development",
                                keyword: "Scenario",
                                line: 9,
                                name: "TC - Development",
                                steps: [
                                    {
                                        arguments: [],
                                        embeddings: [],
                                        keyword: "Given ",
                                        line: 5,
                                        name: "abc123",
                                        result: {
                                            duration: 0,
                                            status: "undefined",
                                        },
                                    },
                                    {
                                        arguments: [],
                                        keyword: "Then ",
                                        line: 6,
                                        name: "xyz9871",
                                        result: {
                                            duration: 0,
                                            status: "skipped",
                                        },
                                    },
                                    {
                                        arguments: [],
                                        keyword: "Given ",
                                        line: 10,
                                        name: "an assumption",
                                        result: {
                                            duration: 0,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        arguments: [],
                                        keyword: "When ",
                                        line: 11,
                                        name: "a when",
                                        result: {
                                            duration: 0,
                                            status: "unknown",
                                        },
                                    },
                                    {
                                        arguments: [],
                                        keyword: "And ",
                                        line: 12,
                                        name: "an and",
                                        result: {
                                            duration: 0,
                                            status: "failed",
                                        },
                                    },
                                    {
                                        arguments: [],
                                        keyword: "Then ",
                                        line: 13,
                                        name: "a then",
                                        result: {
                                            duration: 0,
                                            status: "pending",
                                        },
                                    },
                                ],
                                tags: [
                                    {
                                        line: 8,
                                        name: "@ABC-63",
                                    },
                                    {
                                        line: 67,
                                        name: "@TestName:CYP-123",
                                    },
                                ],
                                type: "scenario",
                            },
                        ],
                        id: "a-tagged-feature",
                        keyword: "Feature",
                        line: 1,
                        name: "A tagged feature",
                        tags: [],
                        uri: "cypress/e2e/spec.cy.feature",
                    },
                ])
            );
            const features = await command.compute();
            expect(features[0].elements[0].steps[0].result.status).to.eq("undefined");
            expect(features[0].elements[0].steps[1].result.status).to.eq("WAS SKIPPED");
            expect(features[0].elements[0].steps[2].result.status).to.eq("DID PASS");
            expect(features[0].elements[0].steps[3].result.status).to.eq("unknown");
            expect(features[0].elements[0].steps[4].result.status).to.eq("DID FAIL");
            expect(features[0].elements[0].steps[5].result.status).to.eq("IS PENDING");
        });

        it("skips background elements", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            cucumberReport[0].elements[0].type = "background";
            const logger = getMockedLogger();
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport)
            );
            const features = await command.compute();
            expect(features[0].elements).to.have.length(2);
        });

        it("skips embeddings if screenshots are disabled", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const logger = getMockedLogger();
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport)
            );
            const features = await command.compute();
            expect(features[0].elements[0].steps[0].embeddings).to.be.empty;
            expect(features[0].elements[0].steps[1].embeddings).to.be.empty;
            expect(features[0].elements[1].steps[0].embeddings).to.be.empty;
            expect(features[0].elements[1].steps[1].embeddings).to.be.empty;
            expect(features[0].elements[2].steps[0].embeddings).to.be.empty;
            expect(features[0].elements[2].steps[1].embeddings).to.be.empty;
        });

        it("skips untagged scenarios", async () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartUntagged.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: false,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport)
            );
            const features = await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    ${path.resolve(
                        ".",
                        "test",
                        "resources",
                        "cypress",
                        "e2e",
                        "features",
                        "example.feature"
                    )}

                      Scenario: <no name>

                        Skipping result upload.

                          Caused by: Scenario: <no name>

                            No test issue keys found in tags.

                            You can target existing test issues by adding a corresponding tag:

                              @CYP-123
                              Scenario:
                                When I prepare something
                                ...

                            You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                              Plugin configuration:

                                {
                                  cucumber: {
                                    prefixes: {
                                      test: "TestName:"
                                    }
                                  }
                                }

                              Feature file:

                                @TestName:CYP-123
                                Scenario:
                                  When I prepare something
                                  ...

                            For more information, visit:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                            - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                `)
            );
            expect(features).to.have.length(0);
        });

        it("skips scenarios without recognised issue tags", async () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: {} },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: false,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport)
            );
            const features = await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    ${path.resolve(".", "test", "resources", "cypress", "e2e", "spec.cy.feature")}

                      Scenario: TC - Development

                        Skipping result upload.

                          Caused by: Scenario: TC - Development

                            No test issue keys found in tags:

                              @ABC-63
                              @TestName:CYP-123

                            If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray.

                              For example, with the following plugin configuration:

                                {
                                  cucumber: {
                                    prefixes: {
                                      test: "TestName:"
                                    }
                                  }
                                }

                              The following tag will be recognized as a test issue tag by the plugin:

                                @TestName:CYP-123
                                Scenario: TC - Development
                                  Given abc123
                                  ...

                            For more information, visit:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                            - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                `)
            );
            expect(features).to.have.length(0);
        });

        it("includes scenarios with multiple tags", async () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartMultipleTags.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { status: {}, uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport)
            );
            const features = await command.compute();
            expect(features).to.have.length(1);
            expect(features[0].elements[0].tags).to.deep.eq([
                {
                    line: 4,
                    name: "@TestName:CYP-123",
                },
                {
                    line: 4,
                    name: "@TestName:CYP-456",
                },
            ]);
        });
    });
});
