import { expect } from "chai";
import { stub } from "sinon";
import { stubLogging } from "../../../test/util";
import { PATCredentials } from "../../authentication/credentials";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { JiraRepositoryServer } from "./jiraRepositoryServer";

describe("the server issue repository", () => {
    let options: InternalOptions;
    let xrayClient: XrayClientServer;
    let jiraClient: JiraClientServer;
    let repository: JiraRepositoryServer;

    beforeEach(() => {
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
            }
        );
        jiraClient = new JiraClientServer("https://example.org", new PATCredentials("token"));
        xrayClient = new XrayClientServer(
            "https://example.org",
            new PATCredentials("token"),
            jiraClient
        );
        repository = new JiraRepositoryServer(jiraClient, xrayClient, options);
    });

    describe("getSummaries", () => {
        it("fetches summaries", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "summary",
                    name: "Summary",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["summary"],
                    schema: {
                        type: "string",
                        system: "summary",
                    },
                },
            ]);
            const searchStub = stub(jiraClient, "search").resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        summary: "Hello",
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        summary: "Good Morning",
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        summary: "Goodbye",
                    },
                },
            ]);
            const summaries = await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-123": "Hello",
                "CYP-456": "Good Morning",
                "CYP-789": "Goodbye",
            });
            expect(searchStub).to.have.been.calledOnceWithExactly({
                jql: "project = CYP AND issue in (CYP-123,CYP-456,CYP-789)",
                fields: ["summary"],
            });
        });

        it("fetches summaries only for unknown issues", async () => {
            const stubbedGetFields = stub(jiraClient, "getFields").resolves([
                {
                    id: "summary",
                    name: "Summary",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["summary"],
                    schema: {
                        type: "string",
                        system: "summary",
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.onFirstCall().resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        summary: "Hello",
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        summary: "Goodbye",
                    },
                },
            ]);
            stubbedSearch.onSecondCall().resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        summary: "Good Morning",
                    },
                },
            ]);
            await repository.getSummaries("CYP-123", "CYP-789");
            const summaries = await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(summaries).to.deep.eq({
                "CYP-123": "Hello",
                "CYP-456": "Good Morning",
                "CYP-789": "Goodbye",
            });
            // Everything's fetched already, should not fetch anything again.
            await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedGetFields).to.have.been.calledOnce;
            expect(stubbedSearch).to.have.been.calledTwice;
            expect(stubbedSearch.secondCall).to.have.been.calledWithExactly({
                jql: "project = CYP AND issue in (CYP-456)",
                fields: ["summary"],
            });
        });

        it("displays an error for issues which do not exist", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "summary",
                    name: "Summary",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["summary"],
                    schema: {
                        type: "string",
                        system: "summary",
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        summary: "Hello",
                    },
                },
            ]);
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

        it("displays an error when the summary field does not exist", async () => {
            stub(jiraClient, "getFields").resolves([]);
            const stubbedSearch = stub(jiraClient, "search");
            const { stubbedError } = stubLogging();
            const summaries = await repository.getSummaries("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue summaries
                    Failed to fetch Jira field ID for field with name: summary
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field translations in the options:

                      jira: {
                        fields = {
                          "summary": {
                            name: // translation
                          }
                        }
                      }
                `)
            );
            expect(summaries).to.deep.eq({});
        });

        it("handles get field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves(undefined);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                },
            ]);
            const { stubbedError } = stubLogging();
            const summaries = await repository.getSummaries("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue summaries
                    Failed to fetch Jira field ID for field with name: summary
                `)
            );
            expect(summaries).to.deep.eq({});
        });

        it("handles unparseable field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "summary",
                    name: "Summary",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["summary"],
                    schema: {
                        type: "string",
                        system: "summary",
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        summary: ["Good Morning", "Summary 2"],
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        summary: {
                            Something: 5,
                        },
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        summary: "Bonjour",
                    },
                },
            ]);
            const { stubbedError } = stubLogging();
            const summaries = await repository.getSummaries("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue summaries
                    Failed to parse the following Jira field of some issues: summary
                    Expected the field to be: a string
                    Make sure the correct field is present on the following issues:

                      CYP-123: ["Good Morning","Summary 2"]
                      CYP-456: {"Something":5}
                `)
            );
            expect(summaries).to.deep.eq({});
        });
    });

    describe("getDescriptions", () => {
        it("fetches descriptions", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "description",
                    name: "Description",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["description"],
                    schema: {
                        type: "string",
                        system: "description",
                    },
                },
            ]);
            const searchStub = stub(jiraClient, "search").resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        description: "Very informative",
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        description: "Even more informative",
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        description: "Not that informative",
                    },
                },
            ]);
            const descriptions = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-123": "Very informative",
                "CYP-456": "Even more informative",
                "CYP-789": "Not that informative",
            });
            expect(searchStub).to.have.been.calledOnceWithExactly({
                jql: "project = CYP AND issue in (CYP-123,CYP-456,CYP-789)",
                fields: ["description"],
            });
        });

        it("fetches descriptions only for unknown issues", async () => {
            const stubbedGetFields = stub(jiraClient, "getFields").resolves([
                {
                    id: "description",
                    name: "Description",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["description"],
                    schema: {
                        type: "string",
                        system: "description",
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.onFirstCall().resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        description: "Very informative",
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        description: "Not that informative",
                    },
                },
            ]);
            stubbedSearch.onSecondCall().resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        description: "Even more informative",
                    },
                },
            ]);
            await repository.getDescriptions("CYP-123", "CYP-789");
            const descriptions = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(descriptions).to.deep.eq({
                "CYP-123": "Very informative",
                "CYP-456": "Even more informative",
                "CYP-789": "Not that informative",
            });
            // Everything's fetched already, should not fetch anything again.
            await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedGetFields).to.have.been.calledOnce;
            expect(stubbedSearch).to.have.been.calledTwice;
            expect(stubbedSearch.secondCall).to.have.been.calledWithExactly({
                jql: "project = CYP AND issue in (CYP-456)",
                fields: ["description"],
            });
        });

        it("displays an error for issues which do not exist", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "description",
                    name: "Description",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["description"],
                    schema: {
                        type: "string",
                        system: "description",
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        description: "I am a description",
                    },
                },
            ]);
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

        it("displays an error when the description field does not exist", async () => {
            stub(jiraClient, "getFields").resolves([]);
            const stubbedSearch = stub(jiraClient, "search");
            const { stubbedError } = stubLogging();
            const descriptions = await repository.getDescriptions("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue descriptions
                    Failed to fetch Jira field ID for field with name: description
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field translations in the options:

                      jira: {
                        fields = {
                          "description": {
                            name: // translation
                          }
                        }
                      }
                `)
            );
            expect(descriptions).to.deep.eq({});
        });

        it("handles get field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves(undefined);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                },
            ]);
            const { stubbedError } = stubLogging();
            const descriptions = await repository.getDescriptions("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue descriptions
                    Failed to fetch Jira field ID for field with name: description
                `)
            );
            expect(descriptions).to.deep.eq({});
        });

        it("handles unparseable field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "description",
                    name: "Description",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["description"],
                    schema: {
                        type: "string",
                        system: "description",
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        description: ["This is a somewhat unexpected", "description"],
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        description: {
                            Something: 5,
                        },
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        description: "Bonjour (encore)",
                    },
                },
            ]);
            const { stubbedError } = stubLogging();
            const summaries = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue descriptions
                    Failed to parse the following Jira field of some issues: description
                    Expected the field to be: a string
                    Make sure the correct field is present on the following issues:

                      CYP-123: ["This is a somewhat unexpected","description"]
                      CYP-456: {"Something":5}
                `)
            );
            expect(summaries).to.deep.eq({});
        });
    });

    describe("getTestTypes", () => {
        it("fetches test types", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "customfield_12100",
                    name: "Test Type",
                    custom: true,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["cf[12100]", "Test Type"],
                    schema: {
                        type: "option",
                        custom: "com.xpandit.plugins.xray:test-type-custom-field",
                        customId: 12100,
                    },
                },
            ]);
            const searchStub = stub(jiraClient, "search").resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        customfield_12100: {
                            self: "https://example.org/rest/api/2/customFieldOption/12702",
                            value: "Cucumber",
                            id: "12702",
                            disabled: false,
                        },
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        customfield_12100: {
                            self: "https://example.org/rest/api/2/customFieldOption/12701",
                            value: "Generic",
                            id: "12701",
                            disabled: false,
                        },
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        customfield_12100: {
                            self: "https://example.org/rest/api/2/customFieldOption/12700",
                            value: "Manual",
                            id: "12700",
                            disabled: false,
                        },
                    },
                },
            ]);
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-123": "Cucumber",
                "CYP-456": "Generic",
                "CYP-789": "Manual",
            });
            expect(searchStub).to.have.been.calledOnceWithExactly({
                jql: "project = CYP AND issue in (CYP-123,CYP-456,CYP-789)",
                fields: ["customfield_12100"],
            });
        });

        it("fetches test types only for unknown issues", async () => {
            const stubbedGetFields = stub(jiraClient, "getFields").resolves([
                {
                    id: "customfield_12100",
                    name: "Test Type",
                    custom: true,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["cf[12100]", "Test Type"],
                    schema: {
                        type: "option",
                        custom: "com.xpandit.plugins.xray:test-type-custom-field",
                        customId: 12100,
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.onFirstCall().resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        customfield_12100: {
                            self: "https://example.org/rest/api/2/customFieldOption/12702",
                            value: "Cucumber",
                            id: "12702",
                            disabled: false,
                        },
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        customfield_12100: {
                            self: "https://example.org/rest/api/2/customFieldOption/12700",
                            value: "Manual",
                            id: "12700",
                            disabled: false,
                        },
                    },
                },
            ]);
            stubbedSearch.onSecondCall().resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        customfield_12100: {
                            self: "https://example.org/rest/api/2/customFieldOption/12701",
                            value: "Generic",
                            id: "12701",
                            disabled: false,
                        },
                    },
                },
            ]);
            await repository.getTestTypes("CYP-123", "CYP-789");
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(testTypes).to.deep.eq({
                "CYP-123": "Cucumber",
                "CYP-456": "Generic",
                "CYP-789": "Manual",
            });
            // Everything's fetched already, should not fetch anything again.
            await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedGetFields).to.have.been.calledOnce;
            expect(stubbedSearch).to.have.been.calledTwice;
            expect(stubbedSearch.secondCall).to.have.been.calledWithExactly({
                jql: "project = CYP AND issue in (CYP-456)",
                fields: ["customfield_12100"],
            });
        });

        it("displays an error for issues which do not exist", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "customfield_12100",
                    name: "Test Type",
                    custom: true,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["cf[12100]", "Test Type"],
                    schema: {
                        type: "option",
                        custom: "com.xpandit.plugins.xray:test-type-custom-field",
                        customId: 12100,
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        customfield_12100: {
                            self: "https://example.org/rest/api/2/customFieldOption/12705",
                            value: "Custom",
                            id: "12705",
                            disabled: false,
                        },
                    },
                },
            ]);
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
            expect(testTypes).to.deep.eq({
                "CYP-123": "Custom",
            });
        });

        it("displays an error when the test type field does not exist", async () => {
            stub(jiraClient, "getFields").resolves([]);
            const stubbedSearch = stub(jiraClient, "search");
            const { stubbedError } = stubLogging();
            const testTypes = await repository.getTestTypes("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue test types
                    Failed to fetch Jira field ID for field with name: test type
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field translations in the options:

                      jira: {
                        fields = {
                          "testType": {
                            name: // translation
                          }
                        }
                      }
                `)
            );
            expect(testTypes).to.deep.eq({});
        });

        it("handles get field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves(undefined);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                },
            ]);
            const { stubbedError } = stubLogging();
            const testTypes = await repository.getTestTypes("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue test types
                    Failed to fetch Jira field ID for field with name: test type
                `)
            );
            expect(testTypes).to.deep.eq({});
        });

        it("handles unparseable field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "customfield_12100",
                    name: "Test Type",
                    custom: true,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["cf[12100]", "Test Type"],
                    schema: {
                        type: "option",
                        custom: "com.xpandit.plugins.xray:test-type-custom-field",
                        customId: 12100,
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            stubbedSearch.resolves([
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1000",
                    self: "https://example.org/rest/api/2/issue/1000",
                    key: "CYP-123",
                    fields: {
                        customfield_12100: ["This is a somewhat unexpected", "description"],
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        customfield_12100: {
                            Something: 5,
                        },
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        customfield_12100: {
                            self: "https://example.org/rest/api/2/customFieldOption/12701",
                            value: "Generic",
                            id: "12701",
                            disabled: false,
                        },
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1003",
                    self: "https://example.org/rest/api/2/issue/1003",
                    key: "CYP-420",
                    fields: {
                        customfield_12100: null,
                    },
                },
            ]);
            const { stubbedError } = stubLogging();
            const testTypes = await repository.getTestTypes(
                "CYP-123",
                "CYP-456",
                "CYP-789",
                "CYP-420"
            );
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue test types
                    Failed to parse the following Jira field of some issues: customfield_12100
                    Expected the field to be: an object with a value property
                    Make sure the correct field is present on the following issues:

                      CYP-123: ["This is a somewhat unexpected","description"]
                      CYP-456: {"Something":5}
                      CYP-420: null
                `)
            );
            expect(testTypes).to.deep.eq({});
        });
    });
});
