import { expect } from "chai";
import { getMockedJiraIssueFetcher } from "../../../test/mocks";
import { arrayEquals, stubLogging } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { initJiraOptions } from "../../context";
import { InternalJiraOptions } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { CachingJiraFieldRepository, IJiraFieldRepository } from "./fields/jiraFieldRepository";
import { IJiraIssueFetcher, JiraIssueFetcher } from "./fields/jiraIssueFetcher";
import { CachingJiraRepository, IJiraRepository } from "./jiraRepository";

describe("the cloud issue repository", () => {
    let jiraOptions: InternalJiraOptions;
    let jiraFieldRepository: IJiraFieldRepository;
    let jiraFieldFetcher: IJiraIssueFetcher;
    let repository: IJiraRepository;
    let mockedFieldFetcher = getMockedJiraIssueFetcher();

    beforeEach(() => {
        jiraOptions = initJiraOptions(
            {},
            {
                projectKey: "CYP",
                url: "https://example.org",
            }
        );
        const jiraClient = new JiraClientCloud(
            "https://example.org",
            new BasicAuthCredentials("user", "xyz")
        );
        jiraFieldRepository = new CachingJiraFieldRepository(jiraClient);
        jiraFieldFetcher = new JiraIssueFetcher(
            jiraClient,
            jiraFieldRepository,
            jiraOptions.fields
        );
        repository = new CachingJiraRepository(jiraFieldRepository, jiraFieldFetcher);
        mockedFieldFetcher = getMockedJiraIssueFetcher();
    });

    describe("getSummaries", () => {
        let mockedFieldFetcher = getMockedJiraIssueFetcher();

        beforeEach(() => {
            mockedFieldFetcher = getMockedJiraIssueFetcher();
        });

        it("fetches summaries", async () => {
            mockedFieldFetcher.fetchSummaries = async function (
                ...issueKeys: string[]
            ): Promise<StringMap<string>> {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-456", "CYP-789"])) {
                    return {
                        "CYP-123": "Hello",
                        "CYP-456": "Good Morning",
                        "CYP-789": "Goodbye",
                    };
                }
                throw new Error(`Unexpected argument: ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const summaries = await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-123": "Hello",
                "CYP-456": "Good Morning",
                "CYP-789": "Goodbye",
            });
        });

        it("fetches summaries only for unknown issues", async () => {
            mockedFieldFetcher.fetchSummaries = async function (
                ...issueKeys: string[]
            ): Promise<StringMap<string>> {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-789"])) {
                    return {
                        "CYP-123": "Hello",
                        "CYP-789": "Goodbye",
                    };
                } else if (arrayEquals(issueKeys, ["CYP-456"])) {
                    return {
                        "CYP-456": "Good Morning",
                    };
                }
                throw new Error(`Unexpected argument: ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
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
            mockedFieldFetcher.fetchSummaries = async function (
                ...issueKeys: string[]
            ): Promise<StringMap<string>> {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-456", "CYP-789"])) {
                    return {
                        "CYP-123": "Hello",
                    };
                }
                throw new Error(`Unexpected argument: ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const { stubbedError } = stubLogging();
            const summaries = await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue summaries
                    Make sure these issues exist:

                      CYP-456
                      CYP-789
                `)
            );
            expect(summaries).to.deep.eq({
                "CYP-123": "Hello",
            });
        });

        it("handles get field failures gracefully", async () => {
            mockedFieldFetcher.fetchSummaries = async function (): Promise<StringMap<string>> {
                throw new Error("Expected error");
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const { stubbedError } = stubLogging();
            const summaries = await repository.getSummaries("CYP-123");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue summaries
                    Expected error
                `)
            );
            expect(summaries).to.deep.eq({});
        });
    });

    describe("getDescriptions", () => {
        it("fetches descriptions", async () => {
            mockedFieldFetcher.fetchDescriptions = async (
                ...issueKeys: []
            ): Promise<StringMap<string>> => {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-456", "CYP-789"])) {
                    return {
                        "CYP-123": "Very informative",
                        "CYP-456": "Even more informative",
                        "CYP-789": "Not that informative",
                    };
                }
                throw new Error(`Unexpected argument. ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const descriptions = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-123": "Very informative",
                "CYP-456": "Even more informative",
                "CYP-789": "Not that informative",
            });
        });

        it("fetches descriptions only for unknown issues", async () => {
            mockedFieldFetcher.fetchDescriptions = async (
                ...issueKeys: []
            ): Promise<StringMap<string>> => {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-789"])) {
                    return {
                        "CYP-123": "Very informative",
                        "CYP-789": "Not that informative",
                    };
                } else if (arrayEquals(issueKeys, ["CYP-456"])) {
                    return {
                        "CYP-456": "Even more informative",
                    };
                }
                throw new Error(`Unexpected argument. ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
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
            mockedFieldFetcher.fetchDescriptions = async (): Promise<StringMap<string>> => {
                return {
                    "CYP-123": "I am a description",
                };
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const { stubbedError } = stubLogging();
            const descriptions = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue descriptions
                    Make sure these issues exist:

                      CYP-456
                      CYP-789
                `)
            );
            expect(descriptions).to.deep.eq({
                "CYP-123": "I am a description",
            });
        });

        it("handles get field failures gracefully", async () => {
            mockedFieldFetcher.fetchDescriptions = () => {
                throw new Error("Expected error");
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const { stubbedError } = stubLogging();
            const descriptions = await repository.getDescriptions("CYP-123");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue descriptions
                    Expected error
                `)
            );
            expect(descriptions).to.deep.eq({});
        });
    });
    describe("getTestTypes", () => {
        it("fetches test types", async () => {
            mockedFieldFetcher.fetchTestTypes = async (): Promise<StringMap<string>> => {
                return {
                    "CYP-123": "Cucumber",
                    "CYP-456": "Generic",
                    "CYP-789": "Manual",
                };
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-123": "Cucumber",
                "CYP-456": "Generic",
                "CYP-789": "Manual",
            });
        });

        it("fetches test types only for unknown issues", async () => {
            mockedFieldFetcher.fetchTestTypes = async (
                ...issueKeys: string[]
            ): Promise<StringMap<string>> => {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-789"])) {
                    return {
                        "CYP-123": "Cucumber",
                        "CYP-789": "Manual",
                    };
                } else if (arrayEquals(issueKeys, ["CYP-456"])) {
                    return {
                        "CYP-456": "Generic",
                    };
                }
                throw new Error(`Unexpected argument: ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
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
            mockedFieldFetcher.fetchTestTypes = async (
                ...issueKeys: string[]
            ): Promise<StringMap<string>> => {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-456", "CYP-789"])) {
                    return {
                        "CYP-123": "Cucumber",
                    };
                }
                throw new Error(`Unexpected argument: ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const { stubbedError } = stubLogging();
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue test types
                    Make sure these issues exist and are test issues:

                      CYP-456
                      CYP-789
                `)
            );
            expect(testTypes).to.deep.eq({ "CYP-123": "Cucumber" });
        });

        it("handles failed test type requests gracefully", async () => {
            mockedFieldFetcher.fetchTestTypes = () => {
                throw new Error("Expected error");
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const { stubbedError } = stubLogging();
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue test types
                    Expected error
                `)
            );
            expect(testTypes).to.deep.eq({});
        });
    });

    describe("getLabels", () => {
        it("fetches labels", async () => {
            mockedFieldFetcher.fetchLabels = async (
                ...issueKeys: string[]
            ): Promise<StringMap<string[]>> => {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-456", "CYP-789"])) {
                    return {
                        "CYP-123": ["A", "B", "C"],
                        "CYP-456": [],
                        "CYP-789": ["D"],
                    };
                }
                throw new Error(`Unexpected argument: ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const labels = await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(labels).to.deep.eq({
                "CYP-123": ["A", "B", "C"],
                "CYP-456": [],
                "CYP-789": ["D"],
            });
        });

        it("fetches labels only for unknown issues", async () => {
            mockedFieldFetcher.fetchLabels = async (
                ...issueKeys: string[]
            ): Promise<StringMap<string[]>> => {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-789"])) {
                    return {
                        "CYP-123": ["A", "B", "C"],
                        "CYP-789": ["E"],
                    };
                } else if (arrayEquals(issueKeys, ["CYP-456"])) {
                    return {
                        "CYP-456": ["D"],
                    };
                }
                throw new Error(`Unexpected argument: ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
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
            mockedFieldFetcher.fetchLabels = async (
                ...issueKeys: string[]
            ): Promise<StringMap<string[]>> => {
                if (arrayEquals(issueKeys, ["CYP-123", "CYP-456", "CYP-789"])) {
                    return {
                        "CYP-123": ["X"],
                    };
                }
                throw new Error(`Unexpected argument: ${issueKeys}`);
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const { stubbedError } = stubLogging();
            const labels = await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue labels
                    Make sure these issues exist:

                      CYP-456
                      CYP-789
                `)
            );
            expect(labels).to.deep.eq({
                "CYP-123": ["X"],
            });
        });

        it("handles get field failures gracefully", async () => {
            mockedFieldFetcher.fetchLabels = () => {
                throw new Error("Expected error");
            };
            repository = new CachingJiraRepository(jiraFieldRepository, mockedFieldFetcher);
            const { stubbedError } = stubLogging();
            const labels = await repository.getLabels("CYP-123");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue labels
                    Expected error
                `)
            );
            expect(labels).to.deep.eq({});
        });
    });
});
