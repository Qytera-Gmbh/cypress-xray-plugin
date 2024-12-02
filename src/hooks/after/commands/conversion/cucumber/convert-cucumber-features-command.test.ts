import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { dedent } from "../../../../../util/dedent";
import { Level, LOG } from "../../../../../util/logging";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { ConvertCucumberFeaturesCommand } from "./convert-cucumber-features-command";

describe(relative(cwd(), __filename), async () => {
    await describe(ConvertCucumberFeaturesCommand.name, async () => {
        await it("converts cucumber results into cucumber features data", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport.slice(0, 1)) }
            );

            const features = await command.compute();

            assert.ok(Array.isArray(features));
            assert.strictEqual(features.length, 1);
        });

        await it("returns parameters", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport.slice(0, 1)) }
            );

            assert.deepStrictEqual(command.getParameters(), {
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

        await it("converts cucumber results into cloud cucumber features data", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport.slice(0, 1)) }
            );

            const features = await command.compute();

            assert.ok(Array.isArray(features));
            assert.strictEqual(features.length, 1);
        });

        await it("includes all tagged features and tests", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport) }
            );

            const features = await command.compute();

            assert.ok(Array.isArray(features));
            assert.strictEqual(features.length, 2);
            assert.ok(Array.isArray(features[0].elements));
            assert.strictEqual(features[0].elements.length, 3);
            assert.ok(Array.isArray(features[1].elements));
            assert.strictEqual(features[1].elements.length, 1);
        });

        await it("uses the configured test execution issue key", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                {
                    cucumberResults: new ConstantCommand(LOG, cucumberReport),
                    testExecutionIssueKey: new ConstantCommand(LOG, "CYP-456"),
                }
            );

            const features = await command.compute();

            assert.deepStrictEqual(features[0].tags, [{ name: "@CYP-456" }]);
            assert.deepStrictEqual(features[1].tags, [{ name: "@CYP-456" }]);
        });

        await it("uses the configured test execution issue key even without existing tags", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            delete cucumberReport[0].tags;
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
                LOG,
                {
                    cucumberResults: new ConstantCommand(LOG, cucumberReport),
                    testExecutionIssueKey: new ConstantCommand(LOG, "CYP-456"),
                }
            );

            const features = await command.compute();

            assert.deepStrictEqual(features[0].tags, [{ name: "@CYP-456" }]);
        });

        await it("includes screenshots if enabled", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                    xray: { status: {}, uploadScreenshots: true },
                },
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport) }
            );
            const features = await command.compute();

            assert.strictEqual(features[0].elements[2].steps[1].embeddings?.length, 1);
            assert.deepStrictEqual(
                typeof features[0].elements[2].steps[1].embeddings[0].data,
                "string"
            );
            assert.deepStrictEqual(
                features[0].elements[2].steps[1].embeddings[0].mime_type,
                "image/png"
            );
        });

        await it("respects custom statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
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
                LOG,
                {
                    cucumberResults: new ConstantCommand(LOG, [
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
                    ]),
                }
            );
            const features = await command.compute();

            assert.strictEqual(features[0].elements[0].steps[0].result.status, "undefined");
            assert.strictEqual(features[0].elements[0].steps[1].result.status, "WAS SKIPPED");
            assert.strictEqual(features[0].elements[0].steps[2].result.status, "DID PASS");
            assert.strictEqual(features[0].elements[0].steps[3].result.status, "unknown");
            assert.strictEqual(features[0].elements[0].steps[4].result.status, "DID FAIL");
            assert.strictEqual(features[0].elements[0].steps[5].result.status, "IS PENDING");
        });

        await it("skips background elements", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            cucumberReport[0].elements[0].type = "background";
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport) }
            );

            const features = await command.compute();

            assert.strictEqual(features[0].elements.length, 2);
        });

        await it("skips embeddings if screenshots are disabled", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport) }
            );

            const features = await command.compute();

            assert.deepStrictEqual(features[0].elements[0].steps[0].embeddings, []);
            assert.deepStrictEqual(features[0].elements[0].steps[1].embeddings, []);
            assert.deepStrictEqual(features[0].elements[1].steps[0].embeddings, []);
            assert.deepStrictEqual(features[0].elements[1].steps[1].embeddings, []);
            assert.deepStrictEqual(features[0].elements[2].steps[0].embeddings, []);
            assert.deepStrictEqual(features[0].elements[2].steps[1].embeddings, []);
        });

        await it("skips untagged scenarios", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport) }
            );

            const features = await command.compute();

            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.WARNING,
                dedent(`
                    ${resolve(
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
                `),
            ]);
            assert.deepStrictEqual(features, []);
        });

        await it("skips scenarios without recognised issue tags", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport) }
            );

            const features = await command.compute();

            assert.deepStrictEqual(message.mock.calls[3].arguments, [
                Level.WARNING,
                dedent(`
                    ${resolve(".", "test", "resources", "cypress", "e2e", "spec.cy.feature")}

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
                `),
            ]);
            assert.deepStrictEqual(features, []);
        });

        await it("includes scenarios with multiple tags", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
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
                LOG,
                { cucumberResults: new ConstantCommand(LOG, cucumberReport) }
            );

            const features = await command.compute();

            assert.strictEqual(features.length, 1);
            assert.deepStrictEqual(features[0].elements[0].tags, [
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
