import { expect } from "chai";
import { SinonStubbedInstance } from "sinon";
import {
    getMockedJiraFieldRepository,
    getMockedJiraIssueFetcher,
    getMockedLogger,
} from "../../../test/mocks";
import { Level } from "../../logging/logging";
import { dedent } from "../../util/dedent";
import { IJiraFieldRepository } from "./fields/jiraFieldRepository";
import { IJiraIssueFetcher } from "./fields/jiraIssueFetcher";
import { CachingJiraRepository, IJiraRepository } from "./jiraRepository";

describe("the cloud issue repository", () => {
    let jiraFieldRepository: SinonStubbedInstance<IJiraFieldRepository>;
    let jiraIssueFetcher: SinonStubbedInstance<IJiraIssueFetcher>;
    let repository: IJiraRepository;

    beforeEach(() => {
        jiraFieldRepository = getMockedJiraFieldRepository();
        jiraIssueFetcher = getMockedJiraIssueFetcher();
        repository = new CachingJiraRepository(jiraFieldRepository, jiraIssueFetcher);
    });

    describe("getSummaries", () => {
        it("fetches summaries", async () => {
            jiraIssueFetcher.fetchSummaries
                .withArgs(...["CYP-123", "CYP-456", "CYP-789"])
                .resolves({
                    "CYP-123": "Hello",
                    "CYP-456": "Good Morning",
                    "CYP-789": "Goodbye",
                });
            const summaries = await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-123": "Hello",
                "CYP-456": "Good Morning",
                "CYP-789": "Goodbye",
            });
        });

        it("fetches summaries only for unknown issues", async () => {
            jiraIssueFetcher.fetchSummaries.withArgs(...["CYP-123", "CYP-789"]).resolves({
                "CYP-123": "Hello",
                "CYP-789": "Goodbye",
            });
            jiraIssueFetcher.fetchSummaries.withArgs(...["CYP-456"]).resolves({
                "CYP-456": "Good Morning",
            });
            await repository.getSummaries("CYP-123", "CYP-789");
            const summaries = await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-123": "Hello",
                "CYP-456": "Good Morning",
                "CYP-789": "Goodbye",
            });
            // Everything's fetched already, should not fetch anything again.
            await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
        });

        it("displays an error for issues which do not exist", async () => {
            jiraIssueFetcher.fetchSummaries
                .withArgs(...["CYP-123", "CYP-456", "CYP-789"])
                .resolves({
                    "CYP-123": "Hello",
                });
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.ERROR,
                    dedent(`
                        Failed to fetch issue summaries
                        Make sure these issues exist:
                          CYP-456
                          CYP-789
                    `)
                )
                .onFirstCall()
                .returns();
            const summaries = await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-123": "Hello",
            });
        });

        it("handles get field failures gracefully", async () => {
            jiraIssueFetcher.fetchSummaries.rejects(new Error("Expected error"));
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.ERROR,
                    dedent(`
                        Failed to fetch issue summaries
                        Expected error
                    `)
                )
                .onFirstCall()
                .returns();
            const summaries = await repository.getSummaries("CYP-123");
            expect(summaries).to.deep.eq({});
        });
    });

    describe("getDescriptions", () => {
        it("fetches descriptions", async () => {
            jiraIssueFetcher.fetchDescriptions
                .withArgs(...["CYP-123", "CYP-456", "CYP-789"])
                .resolves({
                    "CYP-123": "Very informative",
                    "CYP-456": "Even more informative",
                    "CYP-789": "Not that informative",
                });
            const descriptions = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-123": "Very informative",
                "CYP-456": "Even more informative",
                "CYP-789": "Not that informative",
            });
        });

        it("fetches descriptions only for unknown issues", async () => {
            jiraIssueFetcher.fetchDescriptions.withArgs(...["CYP-123", "CYP-789"]).resolves({
                "CYP-123": "Very informative",
                "CYP-789": "Not that informative",
            });
            jiraIssueFetcher.fetchDescriptions.withArgs(...["CYP-456"]).resolves({
                "CYP-456": "Even more informative",
            });
            await repository.getDescriptions("CYP-123", "CYP-789");
            const descriptions = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-123": "Very informative",
                "CYP-456": "Even more informative",
                "CYP-789": "Not that informative",
            });
            // Everything's fetched already, should not fetch anything again.
            await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
        });

        it("displays an error for issues which do not exist", async () => {
            jiraIssueFetcher.fetchDescriptions.resolves({
                "CYP-123": "I am a description",
            });
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.ERROR,
                    dedent(`
                        Failed to fetch issue descriptions
                        Make sure these issues exist:
                          CYP-456
                          CYP-789
                    `)
                )
                .onFirstCall()
                .returns();
            const descriptions = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-123": "I am a description",
            });
        });

        it("handles get field failures gracefully", async () => {
            jiraIssueFetcher.fetchDescriptions.rejects(new Error("Expected error"));
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.ERROR,
                    dedent(`
                        Failed to fetch issue descriptions
                        Expected error
                    `)
                )
                .onFirstCall()
                .returns();
            const descriptions = await repository.getDescriptions("CYP-123");
            expect(descriptions).to.deep.eq({});
        });
    });
    describe("getTestTypes", () => {
        it("fetches test types", async () => {
            jiraIssueFetcher.fetchTestTypes.resolves({
                "CYP-123": "Cucumber",
                "CYP-456": "Generic",
                "CYP-789": "Manual",
            });
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-123": "Cucumber",
                "CYP-456": "Generic",
                "CYP-789": "Manual",
            });
        });

        it("fetches test types only for unknown issues", async () => {
            jiraIssueFetcher.fetchTestTypes.withArgs(...["CYP-123", "CYP-789"]).resolves({
                "CYP-123": "Cucumber",
                "CYP-789": "Manual",
            });
            jiraIssueFetcher.fetchTestTypes.withArgs(...["CYP-456"]).resolves({
                "CYP-456": "Generic",
            });
            await repository.getTestTypes("CYP-123", "CYP-789");
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-123": "Cucumber",
                "CYP-456": "Generic",
                "CYP-789": "Manual",
            });
            // Everything's fetched already, should not fetch anything again.
            await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
        });

        it("displays an error for issues which do not exist", async () => {
            jiraIssueFetcher.fetchTestTypes
                .withArgs(...["CYP-123", "CYP-456", "CYP-789"])
                .resolves({
                    "CYP-123": "Cucumber",
                });
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.ERROR,
                    dedent(`
                        Failed to fetch issue test types
                        Make sure these issues exist and are test issues:
                          CYP-456
                          CYP-789
                    `)
                )
                .onFirstCall()
                .returns();
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");

            expect(testTypes).to.deep.eq({ "CYP-123": "Cucumber" });
        });

        it("handles failed test type requests gracefully", async () => {
            jiraIssueFetcher.fetchTestTypes.rejects(new Error("Expected error"));
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.ERROR,
                    dedent(`
                        Failed to fetch issue test types
                        Expected error
                    `)
                )
                .onFirstCall()
                .returns();
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({});
        });
    });

    describe("getLabels", () => {
        it("fetches labels", async () => {
            jiraIssueFetcher.fetchLabels.withArgs("CYP-123", "CYP-456", "CYP-789").resolves({
                "CYP-123": ["A", "B", "C"],
                "CYP-456": [],
                "CYP-789": ["D"],
            });
            const labels = await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(labels).to.deep.eq({
                "CYP-123": ["A", "B", "C"],
                "CYP-456": [],
                "CYP-789": ["D"],
            });
        });

        it("fetches labels only for unknown issues", async () => {
            jiraIssueFetcher.fetchLabels.withArgs("CYP-123", "CYP-789").resolves({
                "CYP-123": ["A", "B", "C"],
                "CYP-789": ["E"],
            });
            jiraIssueFetcher.fetchLabels.withArgs(...["CYP-456"]).resolves({
                "CYP-456": ["D"],
            });
            await repository.getLabels("CYP-123", "CYP-789");
            const labels = await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(labels).to.deep.eq({
                "CYP-123": ["A", "B", "C"],
                "CYP-456": ["D"],
                "CYP-789": ["E"],
            });
            // Everything's fetched already, should not fetch anything again.
            await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
        });

        it("displays an error for issues which do not exist", async () => {
            jiraIssueFetcher.fetchLabels.withArgs(...["CYP-123", "CYP-456", "CYP-789"]).resolves({
                "CYP-123": ["X"],
            });
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.ERROR,
                    dedent(`
                        Failed to fetch issue labels
                        Make sure these issues exist:
                          CYP-456
                          CYP-789
                    `)
                )
                .onFirstCall()
                .returns();
            const labels = await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(labels).to.deep.eq({
                "CYP-123": ["X"],
            });
        });

        it("handles get field failures gracefully", async () => {
            jiraIssueFetcher.fetchLabels.rejects(new Error("Expected error"));
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.ERROR,
                    dedent(`
                        Failed to fetch issue labels
                        Expected error
                    `)
                )
                .onFirstCall()
                .returns();
            const labels = await repository.getLabels("CYP-123");
            expect(labels).to.deep.eq({});
        });
    });
});
