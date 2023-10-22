import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { arrayEquals } from "../../../../test/util";
import { IJiraClient } from "../../../client/jira/jiraClient";
import { IXrayClientCloud } from "../../../client/xray/xrayClientCloud";
import { initJiraOptions } from "../../../context";
import { ISearchRequest } from "../../../types/jira/requests/search";
import { IIssue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { IJiraFieldRepository } from "./jiraFieldRepository";
import { JiraIssueFetcher, JiraIssueFetcherCloud } from "./jiraIssueFetcher";

chai.use(chaiAsPromised);

describe("the jira issue fetcher", () => {
    let mockedFieldRepository: IJiraFieldRepository;
    let mockedJiraClient: IJiraClient;

    beforeEach(() => {
        mockedFieldRepository = {
            getFieldId: () => {
                throw new Error("Mock called unexpectedly");
            },
        };
        mockedJiraClient = {
            search: () => {
                throw new Error("Mock called unexpectedly");
            },
            addAttachment: () => {
                throw new Error("Mock called unexpectedly");
            },
            getIssueTypes: () => {
                throw new Error("Mock called unexpectedly");
            },
            getFields: () => {
                throw new Error("Mock called unexpectedly");
            },
            editIssue: () => {
                throw new Error("Mock called unexpectedly");
            },
        };
    });

    describe("fetchDescriptions", () => {
        it("uses provided description IDs", async () => {
            mockedJiraClient.search = async (
                request: ISearchRequest
            ): Promise<IIssue[] | undefined> => {
                if (request.fields && request.fields.includes("customfield_456")) {
                    if (request.jql === "issue in (CYP-789)") {
                        return [{ key: "CYP-789", fields: { customfield_456: "orange juice" } }];
                    }
                }
                throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
            };
            const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository, {
                description: "customfield_456",
            });
            const descriptions = await fetcher.fetchDescriptions("CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-789": "orange juice",
            });
        });

        it("fetches description IDs automatically", async () => {
            mockedFieldRepository.getFieldId = async (fieldName: string): Promise<string> => {
                if (fieldName === "description") {
                    return "customfield_456";
                }
                throw new Error(`Unexpected argument: ${fieldName}`);
            };
            mockedJiraClient.search = async (
                request: ISearchRequest
            ): Promise<IIssue[] | undefined> => {
                if (request.fields && request.fields.includes("customfield_456")) {
                    if (request.jql === "issue in (CYP-123,CYP-456,CYP-789)") {
                        return [
                            { key: "CYP-123", fields: { customfield_456: "I" } },
                            { key: "CYP-456", fields: { customfield_456: "like" } },
                            { key: "CYP-789", fields: { customfield_456: "orange juice" } },
                        ];
                    }
                }
                throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
            };
            const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository);
            const descriptions = await fetcher.fetchDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-123": "I",
                "CYP-456": "like",
                "CYP-789": "orange juice",
            });
        });
    });

    describe("fetchLabels", () => {
        it("uses provided label IDs", async () => {
            mockedJiraClient.search = async (
                request: ISearchRequest
            ): Promise<IIssue[] | undefined> => {
                if (request.fields && request.fields.includes("customfield_789")) {
                    if (request.jql === "issue in (CYP-789)") {
                        return [
                            {
                                key: "CYP-789",
                                fields: { customfield_789: ["orange juice", "grape juice"] },
                            },
                        ];
                    }
                }
                throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
            };
            const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository, {
                labels: "customfield_789",
            });
            const labels = await fetcher.fetchLabels("CYP-789");
            expect(labels).to.deep.eq({
                "CYP-789": ["orange juice", "grape juice"],
            });
        });
        it("fetches label IDs automatically", async () => {
            mockedFieldRepository.getFieldId = async (fieldName: string): Promise<string> => {
                if (fieldName === "labels") {
                    return "customfield_789";
                }
                throw new Error(`Unexpected argument: ${fieldName}`);
            };
            mockedJiraClient.search = async (
                request: ISearchRequest
            ): Promise<IIssue[] | undefined> => {
                if (request.fields && request.fields.includes("customfield_789")) {
                    if (request.jql === "issue in (CYP-123,CYP-456,CYP-789)") {
                        return [
                            { key: "CYP-123", fields: { customfield_789: ["I"] } },
                            { key: "CYP-456", fields: { customfield_789: ["like"] } },
                            {
                                key: "CYP-789",
                                fields: { customfield_789: ["orange juice", "grape juice"] },
                            },
                        ];
                    }
                }
                throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
            };
            const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository);
            const labels = await fetcher.fetchLabels("CYP-123", "CYP-456", "CYP-789");
            expect(labels).to.deep.eq({
                "CYP-123": ["I"],
                "CYP-456": ["like"],
                "CYP-789": ["orange juice", "grape juice"],
            });
        });
    });

    describe("fetchSummaries", () => {
        it("uses provided summary IDs", async () => {
            mockedJiraClient.search = async (
                request: ISearchRequest
            ): Promise<IIssue[] | undefined> => {
                if (request.fields && request.fields.includes("customfield_123")) {
                    if (request.jql === "issue in (CYP-789)") {
                        return [{ key: "CYP-789", fields: { customfield_123: "apple juice" } }];
                    }
                }
                throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
            };
            const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository, {
                summary: "customfield_123",
            });
            const summaries = await fetcher.fetchSummaries("CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-789": "apple juice",
            });
        });
        it("fetches summary IDs automatically", async () => {
            mockedFieldRepository.getFieldId = async (fieldName: string): Promise<string> => {
                if (fieldName === "summary") {
                    return "customfield_123";
                }
                throw new Error(`Unexpected argument: ${fieldName}`);
            };
            mockedJiraClient.search = async (
                request: ISearchRequest
            ): Promise<IIssue[] | undefined> => {
                if (request.fields && request.fields.includes("customfield_123")) {
                    if (request.jql === "issue in (CYP-123,CYP-456,CYP-789)") {
                        return [
                            { key: "CYP-123", fields: { customfield_123: "I" } },
                            { key: "CYP-456", fields: { customfield_123: "like" } },
                            { key: "CYP-789", fields: { customfield_123: "apple juice" } },
                        ];
                    }
                }
                throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
            };
            const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository);
            const summaries = await fetcher.fetchSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-123": "I",
                "CYP-456": "like",
                "CYP-789": "apple juice",
            });
        });
    });

    describe("fetchTestTypes", () => {
        it("uses provided test type IDs", async () => {
            mockedJiraClient.search = async (
                request: ISearchRequest
            ): Promise<IIssue[] | undefined> => {
                if (request.fields && request.fields.includes("customfield_011")) {
                    if (request.jql === "issue in (CYP-789)") {
                        return [
                            {
                                key: "CYP-789",
                                fields: { customfield_011: { value: "cherry" } },
                            },
                        ];
                    }
                }
                throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
            };
            const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository, {
                testType: "customfield_011",
            });
            const testTypes = await fetcher.fetchTestTypes("CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-789": "cherry",
            });
        });
        it("fetches test type IDs automatically", async () => {
            mockedFieldRepository.getFieldId = async (fieldName: string): Promise<string> => {
                if (fieldName === "test type") {
                    return "customfield_011";
                }
                throw new Error(`Unexpected argument: ${fieldName}`);
            };
            mockedJiraClient.search = async (
                request: ISearchRequest
            ): Promise<IIssue[] | undefined> => {
                if (request.fields && request.fields.includes("customfield_011")) {
                    if (request.jql === "issue in (CYP-123,CYP-456,CYP-789)") {
                        return [
                            {
                                key: "CYP-123",
                                fields: { customfield_011: { value: "banana" } },
                            },
                            {
                                key: "CYP-456",
                                fields: { customfield_011: { value: "pineapple" } },
                            },
                            {
                                key: "CYP-789",
                                fields: { customfield_011: { value: "cherry" } },
                            },
                        ];
                    }
                }
                throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
            };
            const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository);
            const testTypes = await fetcher.fetchTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-123": "banana",
                "CYP-456": "pineapple",
                "CYP-789": "cherry",
            });
        });
    });

    it("displays errors for unknown issues", async () => {
        mockedJiraClient.search = async (
            request: ISearchRequest
        ): Promise<IIssue[] | undefined> => {
            if (request.fields && request.fields.includes("summary")) {
                if (request.jql === "issue in (CYP-123,CYP-456)") {
                    return [
                        { key: "CYP-123", fields: { summary: "banana" } },
                        { fields: { summary: "cherry" } },
                    ];
                }
            }
            throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
        };
        const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository, {
            summary: "summary",
        });
        await expect(fetcher.fetchSummaries("CYP-123", "CYP-456")).to.eventually.be.rejectedWith(
            dedent(`
                Failed to parse Jira field with ID: summary
                Make sure the correct field is present on the following issues:

                  Unknown: {"fields":{"summary":"cherry"}}
            `)
        );
    });

    it("displays errors for unparseable fields", async () => {
        mockedJiraClient.search = async (
            request: ISearchRequest
        ): Promise<IIssue[] | undefined> => {
            if (request.fields && request.fields.includes("summary")) {
                if (request.jql === "issue in (CYP-123,CYP-456)") {
                    return [
                        { key: "CYP-456", fields: { jeff: "cherry" } },
                        { key: "CYP-123", fields: { george: "banana" } },
                    ];
                }
            }
            throw new Error(`Unexpected argument: ${JSON.stringify(request)}`);
        };
        const fetcher = new JiraIssueFetcher(mockedJiraClient, mockedFieldRepository, {
            summary: "summary",
        });
        await expect(fetcher.fetchSummaries("CYP-123", "CYP-456")).to.eventually.be.rejectedWith(
            dedent(`
                Failed to parse Jira field with ID: summary
                Make sure the correct field is present on the following issues:

                  CYP-123: Expected an object containing property 'summary', but got: {"george":"banana"}
                  CYP-456: Expected an object containing property 'summary', but got: {"jeff":"cherry"}
            `)
        );
    });
});

describe("the jira cloud issue fetcher", () => {
    let mockedFieldRepository: IJiraFieldRepository;
    let mockedJiraClient: IJiraClient;
    let mockedXrayClient: IXrayClientCloud;

    beforeEach(() => {
        mockedFieldRepository = {
            getFieldId: () => {
                throw new Error("Mock called unexpectedly");
            },
        };
        mockedJiraClient = {
            search: () => {
                throw new Error("Mock called unexpectedly");
            },
            addAttachment: () => {
                throw new Error("Mock called unexpectedly");
            },
            getIssueTypes: () => {
                throw new Error("Mock called unexpectedly");
            },
            getFields: () => {
                throw new Error("Mock called unexpectedly");
            },
            editIssue: () => {
                throw new Error("Mock called unexpectedly");
            },
        };
        mockedXrayClient = {
            importExecution: () => {
                throw new Error("Mock called unexpectedly");
            },
            exportCucumber: () => {
                throw new Error("Mock called unexpectedly");
            },
            importFeature: () => {
                throw new Error("Mock called unexpectedly");
            },
            importExecutionCucumberMultipart: () => {
                throw new Error("Mock called unexpectedly");
            },
            getTestTypes: () => {
                throw new Error("Mock called unexpectedly");
            },
        };
    });

    describe("fetchTestTypes", () => {
        it("fetches test types automatically", async () => {
            mockedXrayClient.getTestTypes = async (
                projectKey: string,
                ...issueKeys: string[]
            ): Promise<StringMap<string>> => {
                if (
                    projectKey === "CYP" &&
                    arrayEquals(["CYP-123", "CYP-456", "CYP-789"], issueKeys)
                ) {
                    return {
                        "CYP-123": "apple",
                        "CYP-456": "orange",
                        "CYP-789": "pear",
                    };
                }
                throw new Error("Mock called unexpectedly");
            };
            const fetcher = new JiraIssueFetcherCloud(
                mockedJiraClient,
                mockedFieldRepository,
                mockedXrayClient,
                initJiraOptions({}, { projectKey: "CYP", url: "https://example.org" })
            );
            const testTypes = await fetcher.fetchTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-123": "apple",
                "CYP-456": "orange",
                "CYP-789": "pear",
            });
        });
    });
});
