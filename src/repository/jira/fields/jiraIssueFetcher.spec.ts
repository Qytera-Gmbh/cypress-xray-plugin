import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SinonStubbedInstance } from "sinon";
import {
    getMockedJiraClient,
    getMockedJiraFieldRepository,
    getMockedXrayClient,
} from "../../../../test/mocks";
import { arrayEquals } from "../../../../test/util";
import { IJiraClient } from "../../../client/jira/jiraClient";
import { IXrayClientCloud } from "../../../client/xray/xrayClientCloud";
import { initJiraOptions } from "../../../context";
import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { IJiraFieldRepository } from "./jiraFieldRepository";
import { JiraIssueFetcher, JiraIssueFetcherCloud, SupportedFields } from "./jiraIssueFetcher";

chai.use(chaiAsPromised);

describe("the jira issue fetcher", () => {
    let fieldRepository: SinonStubbedInstance<IJiraFieldRepository>;
    let jiraClient: SinonStubbedInstance<IJiraClient>;

    beforeEach(() => {
        fieldRepository = getMockedJiraFieldRepository();
        jiraClient = getMockedJiraClient();
    });

    describe("fetchDescriptions", () => {
        it("uses provided description IDs", async () => {
            jiraClient.search
                .withArgs({ fields: ["customfield_456"], jql: "issue in (CYP-789)" })
                .resolves([{ key: "CYP-789", fields: { customfield_456: "orange juice" } }]);
            const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository, {
                description: "customfield_456",
            });
            const descriptions = await fetcher.fetchDescriptions("CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-789": "orange juice",
            });
        });

        it("fetches description IDs automatically", async () => {
            fieldRepository.getFieldId
                .withArgs(SupportedFields.DESCRIPTION)
                .resolves("customfield_456");
            jiraClient.search
                .withArgs({
                    fields: ["customfield_456"],
                    jql: "issue in (CYP-123,CYP-456,CYP-789)",
                })
                .resolves([
                    { key: "CYP-123", fields: { customfield_456: "I" } },
                    { key: "CYP-456", fields: { customfield_456: "like" } },
                    { key: "CYP-789", fields: { customfield_456: "orange juice" } },
                ]);
            const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository);
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
            jiraClient.search
                .withArgs({
                    fields: ["customfield_789"],
                    jql: "issue in (CYP-789)",
                })
                .resolves([
                    {
                        key: "CYP-789",
                        fields: { customfield_789: ["orange juice", "grape juice"] },
                    },
                ]);
            const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository, {
                labels: "customfield_789",
            });
            const labels = await fetcher.fetchLabels("CYP-789");
            expect(labels).to.deep.eq({
                "CYP-789": ["orange juice", "grape juice"],
            });
        });
        it("fetches label IDs automatically", async () => {
            fieldRepository.getFieldId.withArgs(SupportedFields.LABELS).resolves("customfield_789");
            jiraClient.search
                .withArgs({
                    fields: ["customfield_789"],
                    jql: "issue in (CYP-123,CYP-456,CYP-789)",
                })
                .resolves([
                    { key: "CYP-123", fields: { customfield_789: ["I"] } },
                    { key: "CYP-456", fields: { customfield_789: ["like"] } },
                    {
                        key: "CYP-789",
                        fields: { customfield_789: ["orange juice", "grape juice"] },
                    },
                ]);
            const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository);
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
            jiraClient.search
                .withArgs({
                    fields: ["customfield_123"],
                    jql: "issue in (CYP-789)",
                })
                .resolves([{ key: "CYP-789", fields: { customfield_123: "apple juice" } }]);
            const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository, {
                summary: "customfield_123",
            });
            const summaries = await fetcher.fetchSummaries("CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-789": "apple juice",
            });
        });
        it("fetches summary IDs automatically", async () => {
            fieldRepository.getFieldId
                .withArgs(SupportedFields.SUMMARY)
                .resolves("customfield_123");
            jiraClient.search
                .withArgs({
                    fields: ["customfield_123"],
                    jql: "issue in (CYP-123,CYP-456,CYP-789)",
                })
                .resolves([
                    { key: "CYP-123", fields: { customfield_123: "I" } },
                    { key: "CYP-456", fields: { customfield_123: "like" } },
                    { key: "CYP-789", fields: { customfield_123: "apple juice" } },
                ]);
            const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository);
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
            jiraClient.search
                .withArgs({
                    fields: ["customfield_011"],
                    jql: "issue in (CYP-789)",
                })
                .resolves([
                    {
                        key: "CYP-789",
                        fields: { customfield_011: { value: "cherry" } },
                    },
                ]);
            const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository, {
                testType: "customfield_011",
            });
            const testTypes = await fetcher.fetchTestTypes("CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-789": "cherry",
            });
        });
        it("fetches test type IDs automatically", async () => {
            fieldRepository.getFieldId
                .withArgs(SupportedFields.TEST_TYPE)
                .resolves("customfield_011");
            jiraClient.search
                .withArgs({
                    fields: ["customfield_011"],
                    jql: "issue in (CYP-123,CYP-456,CYP-789)",
                })
                .resolves([
                    { key: "CYP-123", fields: { customfield_011: { value: "banana" } } },
                    { key: "CYP-456", fields: { customfield_011: { value: "pineapple" } } },
                    { key: "CYP-789", fields: { customfield_011: { value: "cherry" } } },
                ]);
            const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository);
            const testTypes = await fetcher.fetchTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-123": "banana",
                "CYP-456": "pineapple",
                "CYP-789": "cherry",
            });
        });
    });

    it("displays errors for unknown issues", async () => {
        jiraClient.search
            .withArgs({
                fields: ["summary"],
                jql: "issue in (CYP-123,CYP-456)",
            })
            .resolves([
                { key: "CYP-123", fields: { summary: "banana" } },
                { fields: { summary: "cherry" } },
            ]);
        const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository, {
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
        jiraClient.search
            .withArgs({
                fields: ["summary"],
                jql: "issue in (CYP-123,CYP-456)",
            })
            .resolves([
                { key: "CYP-456", fields: { jeff: "cherry" } },
                { key: "CYP-123", fields: { george: "banana" } },
            ]);
        const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository, {
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

    it("handles search failures gracefully", async () => {
        jiraClient.search.resolves(undefined);
        const fetcher = new JiraIssueFetcher(jiraClient, fieldRepository, {
            summary: "summary",
        });
        expect(await fetcher.fetchSummaries("CYP-123", "CYP-456")).to.deep.eq({});
    });
});

describe("the jira cloud issue fetcher", () => {
    let fieldRepository: IJiraFieldRepository;
    let jiraClient: IJiraClient;
    let mockedXrayClient: IXrayClientCloud;

    beforeEach(() => {
        fieldRepository = getMockedJiraFieldRepository();
        jiraClient = getMockedJiraClient();
        mockedXrayClient = getMockedXrayClient("cloud");
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
                throw new Error(`Unexpected arguments:\n${projectKey}\n${issueKeys}`);
            };
            const fetcher = new JiraIssueFetcherCloud(
                jiraClient,
                fieldRepository,
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
