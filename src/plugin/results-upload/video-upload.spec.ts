import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { HasAddAttachmentEndpoint } from "../../client/jira/jira-client";
import type { Attachment } from "../../models/jira/responses/attachment";
import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";
import videoUpload from ".//video-upload";

void describe(relative(cwd(), __filename), () => {
    void describe(videoUpload.uploadVideos.name, () => {
        void it("does nothing if no videos were captured", async (context) => {
            const addAttachmentMock = context.mock.fn<HasAddAttachmentEndpoint["addAttachment"]>();
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = await videoUpload.uploadVideos({
                client: { addAttachment: addAttachmentMock },
                cypress: {
                    results: {
                        videos: [],
                    },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        testExecutionIssueKey: "CYP-123",
                    },
                },
            });
            assert.deepStrictEqual(messageMock.mock.calls, []);
            assert.deepStrictEqual(addAttachmentMock.mock.calls, []);
            assert.deepStrictEqual(result, []);
        });

        void it("uploads videos to the correct issue", async (context) => {
            const addAttachmentMock = context.mock.fn<HasAddAttachmentEndpoint["addAttachment"]>();
            const messageMock = context.mock.fn<Logger["message"]>();
            addAttachmentMock.mock.mockImplementationOnce(() =>
                Promise.resolve([
                    { filename: "abc.mp4", size: 12345 },
                    { filename: "def.mov", size: 54321 },
                    { filename: "ghi.avi", size: 112233 },
                ] satisfies Attachment[])
            );
            const result = await videoUpload.uploadVideos({
                client: { addAttachment: addAttachmentMock },
                cypress: {
                    results: {
                        videos: ["abc.mp4", "def.mov", "ghi.avi"],
                    },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        testExecutionIssueKey: "CYP-123",
                    },
                },
            });
            assert.deepStrictEqual(messageMock.mock.calls, []);
            assert.deepStrictEqual(
                addAttachmentMock.mock.calls.map((call) => call.arguments),
                [["CYP-123", "abc.mp4", "def.mov", "ghi.avi"]]
            );
            assert.deepStrictEqual(result, [
                { filename: "abc.mp4", size: 12345 },
                { filename: "def.mov", size: 54321 },
                { filename: "ghi.avi", size: 112233 },
            ]);
        });

        void it("handles upload failures", async (context) => {
            const addAttachmentMock = context.mock.fn<HasAddAttachmentEndpoint["addAttachment"]>();
            const messageMock = context.mock.fn<Logger["message"]>();
            addAttachmentMock.mock.mockImplementationOnce(() =>
                Promise.reject(new Error("Issue does not exist anymore"))
            );
            const result = await videoUpload.uploadVideos({
                client: { addAttachment: addAttachmentMock },
                cypress: {
                    results: {
                        videos: ["abc.mp4", "def.mov", "ghi.avi"],
                    },
                },
                logger: { message: messageMock },
                options: {
                    jira: {
                        testExecutionIssueKey: "CYP-123",
                    },
                },
            });
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            Failed to upload videos to test execution issue CYP-123:

                              Issue does not exist anymore
                        `),
                    ],
                ]
            );
            assert.deepStrictEqual(
                addAttachmentMock.mock.calls.map((call) => call.arguments),
                [["CYP-123", "abc.mp4", "def.mov", "ghi.avi"]]
            );
            assert.deepStrictEqual(result, []);
        });
    });
});
