import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import cucumberResultUpload from "./cucumber-result-upload";

void describe(relative(cwd(), __filename), () => {
    void describe(cucumberResultUpload.uploadCucumberResults.name, () => {
        void it("imports cucumber multipart data", async (context) => {
            const importExecutionCucumberMultipartMock = context.mock.fn(() =>
                Promise.resolve("CYP-123")
            );
            const result = await cucumberResultUpload.uploadCucumberResults({
                client: {
                    importExecutionCucumberMultipart: importExecutionCucumberMultipartMock,
                },
                cucumberJson: [],
                multipartInfo: {
                    fields: {
                        issuetype: { id: "10008" },
                        labels: ["a", "b"],
                        project: { key: "CYP" },
                        summary: "Brand new Test execution",
                    },
                },
            });
            assert.deepStrictEqual(result, { testExecutionIssueKey: "CYP-123" });
            assert.deepStrictEqual(
                importExecutionCucumberMultipartMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        [],
                        {
                            fields: {
                                issuetype: { id: "10008" },
                                labels: ["a", "b"],
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                    ],
                ]
            );
        });

        void it("handles import errors", async (context) => {
            const importExecutionCucumberMultipartMock = context.mock.fn(() =>
                Promise.reject(new Error("Oh no my network"))
            );
            await assert.rejects(
                () =>
                    cucumberResultUpload.uploadCucumberResults({
                        client: {
                            importExecutionCucumberMultipart: importExecutionCucumberMultipartMock,
                        },
                        cucumberJson: [
                            {
                                description: "",
                                elements: [
                                    {
                                        description: "",
                                        id: "example;doing-stuff",
                                        keyword: "Scenario",
                                        line: 6,
                                        name: "",
                                        steps: [
                                            {
                                                embeddings: [],
                                                keyword: "When ",
                                                line: 4,
                                                match: {
                                                    location: "not available:0",
                                                },
                                                name: "I prepare something",
                                                result: {
                                                    duration: 25000000,
                                                    status: "passed",
                                                },
                                            },
                                            {
                                                embeddings: [],
                                                keyword: "When ",
                                                line: 7,
                                                match: {
                                                    location: "not available:0",
                                                },
                                                name: "I do something",
                                                result: {
                                                    duration: 15000000,
                                                    status: "passed",
                                                },
                                            },
                                            {
                                                embeddings: [],
                                                keyword: "Then ",
                                                line: 8,
                                                match: {
                                                    location: "not available:0",
                                                },
                                                name: "something happens",
                                                result: {
                                                    duration: 15000000,
                                                    status: "passed",
                                                },
                                            },
                                        ],
                                        tags: [{ name: "@CYP-123" }],
                                        type: "scenario",
                                    },
                                ],
                                id: "example",
                                keyword: "Feature",
                                line: 1,
                                name: "Example",
                                uri: "cypress/e2e/features/example.feature",
                            },
                        ],
                        multipartInfo: {
                            fields: {
                                issuetype: { id: "10008" },
                                project: { key: "CYP" },
                                summary: "Brand new Test execution",
                            },
                        },
                    }),
                new Error("Oh no my network")
            );
        });
    });
});
