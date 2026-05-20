import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";
import uploadValidation from "./upload-validation";

void describe(relative(cwd(), __filename), () => {
    void describe(uploadValidation.validateUploads.name, () => {
        void it("does nothing if no nothing was uploaded", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = uploadValidation.validateUploads({
                logger: { message: messageMock },
                url: "https://example.org",
            });
            assert.deepStrictEqual(messageMock.mock.calls, []);
            assert.deepStrictEqual(result, undefined);
        });

        void it("handles situations where both execution issue keys are identical", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = uploadValidation.validateUploads({
                cucumberExecutionIssueKey: "ABC-123",
                cypressExecutionIssueKey: "ABC-123",
                logger: { message: messageMock },
                url: "https://example.org",
            });
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "notice",
                        "Uploaded test results to issue: ABC-123 (https://example.org/browse/ABC-123)",
                    ],
                ]
            );
            assert.deepStrictEqual(result, "ABC-123");
        });

        void it("handles situations where both execution issue keys are different", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = uploadValidation.validateUploads({
                cucumberExecutionIssueKey: "ABC-123",
                cypressExecutionIssueKey: "XYZ-123",
                logger: { message: messageMock },
                url: "https://example.org",
            });
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            Cucumber execution results were imported to a different test execution issue than the Cypress execution results:

                              Cypress  test execution issue: XYZ-123 https://example.org/browse/XYZ-123
                              Cucumber test execution issue: ABC-123 https://example.org/browse/ABC-123

                            Make sure your Jira configuration does not prevent modifications of existing test executions.
                        `),
                    ],
                ]
            );
            assert.deepStrictEqual(result, undefined);
        });

        void it("handles uploads of only cypress results", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = uploadValidation.validateUploads({
                cypressExecutionIssueKey: "XYZ-123",
                logger: { message: messageMock },
                url: "https://example.org",
            });
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "notice",
                        "Uploaded Cypress test results to issue: XYZ-123 (https://example.org/browse/XYZ-123)",
                    ],
                ]
            );
            assert.deepStrictEqual(result, "XYZ-123");
        });

        void it("handles uploads of only cucumber results", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = uploadValidation.validateUploads({
                cucumberExecutionIssueKey: "CYP-123",
                logger: { message: messageMock },
                url: "https://example.org",
            });
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "notice",
                        "Uploaded Cucumber test results to issue: CYP-123 (https://example.org/browse/CYP-123)",
                    ],
                ]
            );
            assert.deepStrictEqual(result, "CYP-123");
        });
    });
});
