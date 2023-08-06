import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { stub } from "sinon";
import { BasicAuthCredentials } from "../../../authentication/credentials";
import { JiraClientServer } from "../../../client/jira/jiraClientServer";
import { initOptions } from "../../../context";
import { InternalOptions } from "../../../types/plugin";
import { dedent } from "../../../util/dedent";
import { JiraFieldRepository } from "../fields/jiraFieldRepository";
import { JiraSummaryRepository } from "./jiraSummaryRepository";

chai.use(chaiAsPromised);

describe("the jira summary repository", () => {
    let options: InternalOptions;
    let jiraClient: JiraClientServer;
    let jiraFieldRepository: JiraFieldRepository;
    let repository: JiraSummaryRepository;

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
        jiraClient = new JiraClientServer(
            "https://example.org",
            new BasicAuthCredentials("user", "xyz")
        );
        jiraFieldRepository = new JiraFieldRepository(jiraClient, options);
        repository = new JiraSummaryRepository(jiraFieldRepository, jiraClient, options);
    });

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
        const summaries = await repository.getFieldData("CYP-123", "CYP-456", "CYP-789");
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
        await repository.getFieldData("CYP-123", "CYP-789");
        const summaries = await repository.getFieldData("CYP-123", "CYP-456", "CYP-789");
        expect(summaries).to.deep.eq({
            "CYP-123": "Hello",
            "CYP-456": "Good Morning",
            "CYP-789": "Goodbye",
        });
        // Everything's fetched already, should not fetch anything again.
        await repository.getFieldData("CYP-123", "CYP-456", "CYP-789");
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
        const summaries = await repository.getFieldData("CYP-123", "CYP-456", "CYP-789");
        expect(summaries).to.deep.eq({
            "CYP-123": "Hello",
        });
    });

    it("displays an error when the summary field does not exist", async () => {
        stub(jiraClient, "getFields").resolves([]);
        await expect(repository.getFieldData("CYP-123")).to.eventually.be.rejectedWith(
            dedent(`
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
    });

    it("displays an error containing field hints when the summary field does not exist", async () => {
        stub(jiraClient, "getFields").resolves([
            {
                id: "summary_french",
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
        await expect(repository.getFieldData("CYP-123")).to.eventually.be.rejectedWith(
            dedent(`
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
    });

    it("displays an error when there are multiple summary fields", async () => {
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
            {
                id: "customfield_12345",
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
        await expect(repository.getFieldData("CYP-123")).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: Summary
                There are multiple fields with this name

                Duplicates:
                  id: summary, name: summary, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: summary, schema: [object Object]
                  id: customfield_12345, name: Summary, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: summary (custom), schema: [object Object]

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
    });

    it("handles get field failures gracefully", async () => {
        stub(jiraClient, "getFields").resolves(undefined);
        await expect(repository.getFieldData("CYP-123")).to.eventually.be.rejectedWith(
            "Failed to fetch Jira field ID for field with name: Summary"
        );
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
        await expect(
            repository.getFieldData("CYP-123", "CYP-456", "CYP-789")
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to parse Jira field with ID: summary
                Expected the field to be: a string
                Make sure the correct field is present on the following issues:

                  CYP-123: Summary: ["Good Morning","Summary 2"]
                  CYP-456: Summary: {"Something":5}
            `)
        );
    });
});
