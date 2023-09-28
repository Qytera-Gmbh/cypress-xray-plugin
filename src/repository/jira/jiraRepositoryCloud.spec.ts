import { expect } from "chai";
import { stub } from "sinon";
import { RESOLVED_JWT_CREDENTIALS, stubLogging } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { initJiraOptions } from "../../context";
import { InternalJiraOptions } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { JiraRepositoryCloud } from "./jiraRepositoryCloud";

describe("the cloud issue repository", () => {
    let jiraOptions: InternalJiraOptions;
    let xrayClient: XrayClientCloud;
    let jiraClient: JiraClientCloud;
    let repository: JiraRepositoryCloud;

    beforeEach(() => {
        jiraOptions = initJiraOptions(
            {},
            {
                projectKey: "CYP",
                url: "https://example.org",
            }
        );
        jiraClient = new JiraClientCloud(
            "https://example.org",
            new BasicAuthCredentials("user", "xyz")
        );
        xrayClient = new XrayClientCloud(RESOLVED_JWT_CREDENTIALS);
        repository = new JiraRepositoryCloud(jiraClient, xrayClient, jiraOptions);
    });

    describe("getSummaries", () => {
        it("fetches summaries", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "summary",
                    name: "summary",
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
                    name: "summary",
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
                    name: "summary",
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
                    Failed to fetch Jira field ID for field with name: Summary
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields = {
                          summary: {
                            id: // corresponding field ID
                          }
                        }
                      }
                `)
            );
            expect(summaries).to.deep.eq({});
        });

        it("displays an error containing field hints when the summary field does not exist", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "summary_french",
                    key: "summary_french",
                    name: "Résumé",
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
                {
                    id: "summary_german",
                    key: "summary_german",
                    name: "Zusammenfassung",
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
            const { stubbedError } = stubLogging();
            const summaries = await repository.getSummaries("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue summaries
                    Failed to fetch Jira field ID for field with name: Summary
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    Available fields:
                      name: Résumé, id: summary_french
                      name: Zusammenfassung, id: summary_german

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields = {
                          summary: {
                            id: // corresponding field ID
                          }
                        }
                      }
                `)
            );
            expect(summaries).to.deep.eq({});
        });

        it("displays an error when there are multiple summary fields", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "summary",
                    key: "summary",
                    name: "summary",
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
                {
                    id: "customfield_12345",
                    key: "customfield_12345",
                    name: "Summary",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["summary (custom)"],
                    schema: {
                        type: "string",
                        customId: 5125,
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            const { stubbedError } = stubLogging();
            const summaries = await repository.getSummaries("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue summaries
                    Failed to fetch Jira field ID for field with name: Summary
                    There are multiple fields with this name

                    Duplicates:
                      id: summary, key: summary, name: summary, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: summary, schema: [object Object]
                      id: customfield_12345, key: customfield_12345, name: Summary, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: summary (custom), schema: [object Object]

                    You can provide field IDs in the options:

                      jira: {
                        fields = {
                          summary: {
                            id: // "summary" or "customfield_12345"
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
            const { stubbedError } = stubLogging();
            const summaries = await repository.getSummaries("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue summaries
                    Failed to fetch Jira field ID for field with name: Summary
                `)
            );
            expect(summaries).to.deep.eq({});
        });

        it("handles unparseable field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "summary",
                    name: "summary",
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
                    Failed to parse Jira field with ID: summary
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
                    name: "description",
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
                    name: "description",
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
                    name: "description",
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
                    Failed to fetch Jira field ID for field with name: Description
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields = {
                          description: {
                            id: // corresponding field ID
                          }
                        }
                      }
                `)
            );
            expect(descriptions).to.deep.eq({});
        });

        it("displays an error containing field hints when the description field does not exist", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "description_italian",
                    key: "description_italian",
                    name: "descrizione",
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
                {
                    id: "description_german",
                    key: "description_german",
                    name: "Beschreibung",
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
            const { stubbedError } = stubLogging();
            const descriptions = await repository.getDescriptions("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue descriptions
                    Failed to fetch Jira field ID for field with name: Description
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    Available fields:
                      name: descrizione, id: description_italian
                      name: Beschreibung, id: description_german

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields = {
                          description: {
                            id: // corresponding field ID
                          }
                        }
                      }
                `)
            );
            expect(descriptions).to.deep.eq({});
        });

        it("displays an error when there are multiple description fields", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "description",
                    key: "description",
                    name: "description",
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
                {
                    id: "customfield_12345",
                    key: "customfield_12345",
                    name: "Description",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["description (custom)"],
                    schema: {
                        type: "string",
                        customId: 5125,
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            const { stubbedError } = stubLogging();
            const descriptions = await repository.getDescriptions("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue descriptions
                    Failed to fetch Jira field ID for field with name: Description
                    There are multiple fields with this name

                    Duplicates:
                      id: description, key: description, name: description, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: description, schema: [object Object]
                      id: customfield_12345, key: customfield_12345, name: Description, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: description (custom), schema: [object Object]

                    You can provide field IDs in the options:

                      jira: {
                        fields = {
                          description: {
                            id: // "description" or "customfield_12345"
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
                    Failed to fetch Jira field ID for field with name: Description
                `)
            );
            expect(descriptions).to.deep.eq({});
        });

        it("handles unparseable field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "description",
                    name: "description",
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
            const descriptions = await repository.getDescriptions("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue descriptions
                    Failed to parse Jira field with ID: description
                    Expected the field to be: a string
                    Make sure the correct field is present on the following issues:

                      CYP-123: ["This is a somewhat unexpected","description"]
                      CYP-456: {"Something":5}
                `)
            );
            expect(descriptions).to.deep.eq({});
        });
    });

    describe("getTestTypes", () => {
        it("fetches test types", async () => {
            const getTestTypesStub = stub(xrayClient, "getTestTypes").resolves({
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
            expect(getTestTypesStub).to.have.been.calledOnceWithExactly(
                "CYP",
                "CYP-123",
                "CYP-456",
                "CYP-789"
            );
        });

        it("fetches test types only for unknown issues", async () => {
            const getTestTypesStub = stub(xrayClient, "getTestTypes");
            getTestTypesStub.onFirstCall().resolves({
                "CYP-123": "Cucumber",
                "CYP-456": "Generic",
                "CYP-789": "Manual",
            });
            getTestTypesStub.onSecondCall().resolves({
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
            expect(getTestTypesStub).to.have.been.calledTwice;
            expect(getTestTypesStub.secondCall).to.have.been.calledWithExactly("CYP", "CYP-456");
        });

        it("displays an error for issues which do not exist", async () => {
            stub(xrayClient, "getTestTypes").resolves({
                "CYP-123": "Cucumber",
            });
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
            stub(xrayClient, "getTestTypes").resolves(undefined);
            const { stubbedError } = stubLogging();
            const testTypes = await repository.getTestTypes("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue test types
                    Make sure these issues exist and are test issues:

                      CYP-123
                      CYP-456
                      CYP-789
                `)
            );
            expect(testTypes).to.deep.eq({});
        });
    });

    describe("getLabels", () => {
        it("fetches labels", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "labels",
                    key: "labels",
                    name: "labels",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels"],
                    schema: {
                        type: "array",
                        items: "string",
                        system: "labels",
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
                        labels: ["A", "B", "C"],
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        labels: [],
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        labels: ["D"],
                    },
                },
            ]);
            const labels = await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(labels).to.deep.eq({
                "CYP-123": ["A", "B", "C"],
                "CYP-456": [],
                "CYP-789": ["D"],
            });
            expect(searchStub).to.have.been.calledOnceWithExactly({
                jql: "project = CYP AND issue in (CYP-123,CYP-456,CYP-789)",
                fields: ["labels"],
            });
        });

        it("fetches labels only for unknown issues", async () => {
            const stubbedGetFields = stub(jiraClient, "getFields").resolves([
                {
                    id: "labels",
                    key: "labels",
                    name: "labels",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels"],
                    schema: {
                        type: "array",
                        items: "string",
                        system: "labels",
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
                        labels: ["A", "B", "C"],
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1002",
                    self: "https://example.org/rest/api/2/issue/1002",
                    key: "CYP-789",
                    fields: {
                        labels: ["E"],
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
                        labels: ["D"],
                    },
                },
            ]);
            await repository.getLabels("CYP-123", "CYP-789");
            const labels = await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(labels).to.deep.eq({
                "CYP-123": ["A", "B", "C"],
                "CYP-456": ["D"],
                "CYP-789": ["E"],
            });
            // Everything's fetched already, should not fetch anything again.
            await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedGetFields).to.have.been.calledOnce;
            expect(stubbedSearch).to.have.been.calledTwice;
            expect(stubbedSearch.secondCall).to.have.been.calledWithExactly({
                jql: "project = CYP AND issue in (CYP-456)",
                fields: ["labels"],
            });
        });

        it("displays an error for issues which do not exist", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "labels",
                    key: "labels",
                    name: "labels",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels"],
                    schema: {
                        type: "array",
                        items: "string",
                        system: "labels",
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
                        labels: ["X"],
                    },
                },
            ]);
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

        it("displays an error when the labels field does not exist", async () => {
            stub(jiraClient, "getFields").resolves([]);
            const stubbedSearch = stub(jiraClient, "search");
            const { stubbedError } = stubLogging();
            const labels = await repository.getLabels("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue labels
                    Failed to fetch Jira field ID for field with name: Labels
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields = {
                          labels: {
                            id: // corresponding field ID
                          }
                        }
                      }
                `)
            );
            expect(labels).to.deep.eq({});
        });

        it("displays an error containing field hints when the labels field does not exist", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "labels_french",
                    key: "labels_french",
                    name: "Étiquettes",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels"],
                    schema: {
                        type: "string",
                        system: "labels",
                    },
                },
                {
                    id: "labels_german",
                    key: "labels_german",
                    name: "Stichwort",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels"],
                    schema: {
                        type: "string",
                        system: "labels",
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            const { stubbedError } = stubLogging();
            const labels = await repository.getLabels("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue labels
                    Failed to fetch Jira field ID for field with name: Labels
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    Available fields:
                      name: Étiquettes, id: labels_french
                      name: Stichwort, id: labels_german

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields = {
                          labels: {
                            id: // corresponding field ID
                          }
                        }
                      }
                `)
            );
            expect(labels).to.deep.eq({});
        });

        it("displays an error when there are multiple label fields", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "labels",
                    key: "labels",
                    name: "Labels",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels"],
                    schema: {
                        type: "string",
                        system: "labels",
                    },
                },
                {
                    id: "customfield_12345",
                    key: "customfield_12345",
                    name: "Labels",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels (custom)"],
                    schema: {
                        type: "string",
                        customId: 5125,
                    },
                },
            ]);
            const stubbedSearch = stub(jiraClient, "search");
            const { stubbedError } = stubLogging();
            const labels = await repository.getLabels("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue labels
                    Failed to fetch Jira field ID for field with name: Labels
                    There are multiple fields with this name

                    Duplicates:
                      id: labels, key: labels, name: Labels, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: labels, schema: [object Object]
                      id: customfield_12345, key: customfield_12345, name: Labels, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: labels (custom), schema: [object Object]

                    You can provide field IDs in the options:

                      jira: {
                        fields = {
                          labels: {
                            id: // "labels" or "customfield_12345"
                          }
                        }
                      }
                `)
            );
            expect(labels).to.deep.eq({});
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
            const labels = await repository.getLabels("CYP-123");
            expect(stubbedSearch).to.not.have.been.called;
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue labels
                    Failed to fetch Jira field ID for field with name: Labels
                `)
            );
            expect(labels).to.deep.eq({});
        });

        it("handles unparseable field failures gracefully", async () => {
            stub(jiraClient, "getFields").resolves([
                {
                    id: "labels",
                    name: "labels",
                    custom: false,
                    orderable: true,
                    navigable: true,
                    searchable: true,
                    clauseNames: ["labels"],
                    schema: {
                        type: "string",
                        system: "labels",
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
                        labels: 5,
                    },
                },
                {
                    expand: "operations,versionedRepresentations,editmeta,changelog,renderedFields",
                    id: "1001",
                    self: "https://example.org/rest/api/2/issue/1001",
                    key: "CYP-456",
                    fields: {
                        labels: {
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
                        labels: "Bonjour (encore)",
                    },
                },
            ]);
            const { stubbedError } = stubLogging();
            const labels = await repository.getLabels("CYP-123", "CYP-456", "CYP-789");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                dedent(`
                    Failed to fetch issue labels
                    Failed to parse Jira field with ID: labels
                    Expected the field to be: an array of strings
                    Make sure the correct field is present on the following issues:

                      CYP-123: 5
                      CYP-456: {"Something":5}
                      CYP-789: "Bonjour (encore)"
                `)
            );
            expect(labels).to.deep.eq({});
        });
    });
});
