import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { HasImportFeatureEndpoint } from "../../client/xray/xray-client";
import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";
import { unknownToString } from "../../util/string";
import featureFileUpload from "./feature-file-upload";

void describe(relative(cwd(), __filename), () => {
    void describe(featureFileUpload.uploadFeatureFiles.name, () => {
        void it("does nothing if no feature files are specified", async (context) => {
            const importFeatureMock = context.mock.fn<HasImportFeatureEndpoint["importFeature"]>();
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = await featureFileUpload.uploadFeatureFiles({
                clients: {
                    xray: { importFeature: importFeatureMock },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        projectKey: "CYP",
                    },
                },
                processedFeatureFiles: [],
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(importFeatureMock.mock.calls, []);
            assert.deepStrictEqual(messageMock.mock.calls, []);
        });

        void it("logs nothing for fully synchronized feature files", async (context) => {
            const importFeatureMock = context.mock.fn<HasImportFeatureEndpoint["importFeature"]>(
                async (file, query) => {
                    switch (file) {
                        case "/path/to/feature-file.feature":
                            return Promise.resolve({
                                errors: [],
                                updatedOrCreatedIssues: ["CYP-456", "CYP-123"],
                            });
                        case "/path/to/other-feature-file.feature":
                            return Promise.resolve({
                                errors: [],
                                updatedOrCreatedIssues: ["CYP-789"],
                            });
                    }
                    throw new Error(
                        `Mock called unexpectedly with args: ${unknownToString({ file, query })}`
                    );
                }
            );
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = await featureFileUpload.uploadFeatureFiles({
                clients: {
                    xray: { importFeature: importFeatureMock },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        projectKey: "CYP",
                    },
                },
                processedFeatureFiles: [
                    {
                        allIssueKeys: ["CYP-123", "CYP-456"],
                        filePath: "/path/to/feature-file.feature",
                    },
                    {
                        allIssueKeys: ["CYP-789"],
                        filePath: "/path/to/other-feature-file.feature",
                    },
                ],
            });
            assert.deepStrictEqual(result, ["CYP-123", "CYP-456", "CYP-789"]);
            assert.deepStrictEqual(
                importFeatureMock.mock.calls.map((call) => call.arguments),
                [
                    ["/path/to/feature-file.feature", { projectKey: "CYP" }],
                    ["/path/to/other-feature-file.feature", { projectKey: "CYP" }],
                ]
            );
            assert.deepStrictEqual(messageMock.mock.calls, []);
        });

        void it("logs mismatches for partially synchronized feature files", async (context) => {
            const importFeatureMock = context.mock.fn<HasImportFeatureEndpoint["importFeature"]>(
                async (file, query) => {
                    switch (file) {
                        case "/path/to/feature-file.feature":
                            return Promise.resolve({
                                errors: [],
                                updatedOrCreatedIssues: ["CYP-456", "CYP-789", "CYP-987"],
                            });
                        case "/path/to/other-feature-file.feature":
                            return Promise.resolve({
                                errors: [],
                                updatedOrCreatedIssues: [],
                            });
                        case "/path/to/third-feature-file.feature":
                            return Promise.resolve({
                                errors: [],
                                updatedOrCreatedIssues: ["CYP-42"],
                            });
                    }
                    throw new Error(
                        `Mock called unexpectedly with args: ${unknownToString({ file, query })}`
                    );
                }
            );
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = await featureFileUpload.uploadFeatureFiles({
                clients: {
                    xray: { importFeature: importFeatureMock },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        projectKey: "CYP",
                    },
                },
                processedFeatureFiles: [
                    {
                        allIssueKeys: ["CYP-123", "CYP-456"],
                        filePath: "/path/to/feature-file.feature",
                    },
                    {
                        allIssueKeys: ["CYP-789"],
                        filePath: "/path/to/other-feature-file.feature",
                    },
                    {
                        allIssueKeys: [],
                        filePath: "/path/to/third-feature-file.feature",
                    },
                ],
            });
            assert.deepStrictEqual(result, ["CYP-456"]);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            /path/to/feature-file.feature

                              Mismatch between feature file issue tags and updated Jira issues detected.

                                Issues contained in feature file tags that have not been updated by Xray and may not exist:

                                  CYP-123

                                Issues updated by Xray that do not exist in feature file tags and may have been created:

                                  CYP-789
                                  CYP-987

                              Make sure that:
                              - All issues present in feature file tags belong to existing issues.
                              - Your plugin tag prefix settings match those defined in Xray.

                              More information:
                              - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                              - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                        `),
                    ],
                    [
                        "warning",
                        dedent(`
                            /path/to/other-feature-file.feature

                              Mismatch between feature file issue tags and updated Jira issues detected.

                                Issues contained in feature file tags that have not been updated by Xray and may not exist:

                                  CYP-789

                              Make sure that:
                              - All issues present in feature file tags belong to existing issues.
                              - Your plugin tag prefix settings match those defined in Xray.

                              More information:
                              - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                              - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                        `),
                    ],
                    [
                        "warning",
                        dedent(`
                            /path/to/third-feature-file.feature

                              Mismatch between feature file issue tags and updated Jira issues detected.

                                Issues updated by Xray that do not exist in feature file tags and may have been created:

                                  CYP-42

                              Make sure that:
                              - All issues present in feature file tags belong to existing issues.
                              - Your plugin tag prefix settings match those defined in Xray.

                              More information:
                              - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                              - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                        `),
                    ],
                ]
            );
        });

        void it("handles partially failing uploads", async (context) => {
            const importFeatureMock = context.mock.fn<HasImportFeatureEndpoint["importFeature"]>(
                async (file, query) => {
                    switch (file) {
                        case "/path/to/feature-file.feature":
                            return Promise.reject(new Error("network error"));
                        case "/path/to/other-feature-file.feature":
                            return Promise.resolve({
                                errors: [],
                                updatedOrCreatedIssues: ["CYP-789"],
                            });
                    }
                    throw new Error(
                        `Mock called unexpectedly with args: ${unknownToString({ file, query })}`
                    );
                }
            );
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = await featureFileUpload.uploadFeatureFiles({
                clients: {
                    xray: { importFeature: importFeatureMock },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        projectKey: "CYP",
                    },
                },
                processedFeatureFiles: [
                    {
                        allIssueKeys: ["CYP-123", "CYP-456"],
                        filePath: "/path/to/feature-file.feature",
                    },
                    {
                        allIssueKeys: ["CYP-789"],
                        filePath: "/path/to/other-feature-file.feature",
                    },
                ],
            });
            assert.deepStrictEqual(result, ["CYP-789"]);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "error",
                        dedent(`
                            Failed to upload feature file /path/to/feature-file.feature:

                              network error
                        `),
                    ],
                ]
            );
        });

        void it("handles fully failing uploads", async (context) => {
            const importFeatureMock = context.mock.fn<HasImportFeatureEndpoint["importFeature"]>(
                async () => Promise.reject(new Error("network error"))
            );
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = await featureFileUpload.uploadFeatureFiles({
                clients: {
                    xray: { importFeature: importFeatureMock },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        projectKey: "CYP",
                    },
                },
                processedFeatureFiles: [
                    {
                        allIssueKeys: ["CYP-123", "CYP-456"],
                        filePath: "/path/to/feature-file.feature",
                    },
                    {
                        allIssueKeys: ["CYP-789"],
                        filePath: "/path/to/other-feature-file.feature",
                    },
                ],
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "error",
                        dedent(`
                            Failed to upload feature file /path/to/feature-file.feature:

                              network error
                        `),
                    ],
                    [
                        "error",
                        dedent(`
                            Failed to upload feature file /path/to/other-feature-file.feature:

                              network error
                        `),
                    ],
                ]
            );
        });

        void it("logs xray errors in successful uploads", async (context) => {
            const importFeatureMock = context.mock.fn<HasImportFeatureEndpoint["importFeature"]>(
                async (file, query) => {
                    switch (file) {
                        case "/path/to/feature-file.feature":
                            return Promise.resolve({
                                errors: ["failed to update labels", "a different error"],
                                updatedOrCreatedIssues: ["CYP-456", "CYP-123"],
                            });
                        case "/path/to/other-feature-file.feature":
                            return Promise.resolve({
                                errors: ["a single error"],
                                updatedOrCreatedIssues: ["CYP-789"],
                            });
                    }
                    throw new Error(
                        `Mock called unexpectedly with args: ${unknownToString({ file, query })}`
                    );
                }
            );
            const messageMock = context.mock.fn<Logger["message"]>();
            await featureFileUpload.uploadFeatureFiles({
                clients: {
                    xray: { importFeature: importFeatureMock },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        projectKey: "CYP",
                    },
                },
                processedFeatureFiles: [
                    {
                        allIssueKeys: ["CYP-123", "CYP-456"],
                        filePath: "/path/to/feature-file.feature",
                    },
                    {
                        allIssueKeys: ["CYP-789"],
                        filePath: "/path/to/other-feature-file.feature",
                    },
                ],
            });
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            /path/to/feature-file.feature

                              Encountered errors during feature file import:
                              - failed to update labels
                              - a different error
                        `),
                    ],
                    [
                        "warning",
                        dedent(`
                            /path/to/other-feature-file.feature

                              Encountered errors during feature file import:
                              - a single error
                        `),
                    ],
                ]
            );
        });
    });
});
