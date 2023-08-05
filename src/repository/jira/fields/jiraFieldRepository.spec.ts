import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import dedent from "dedent";
import { stub } from "sinon";
import { stubLogging } from "../../../../test/util";
import { BasicAuthCredentials } from "../../../authentication/credentials";
import { JiraClientServer } from "../../../client/jira/jiraClientServer";
import { initOptions } from "../../../context";
import { InternalOptions } from "../../../types/plugin";
import { JiraFieldRepository } from "./jiraFieldRepository";

chai.use(chaiAsPromised);

describe.only("the jira field repository", () => {
    let options: InternalOptions;
    let jiraClient: JiraClientServer;
    let repository: JiraFieldRepository;

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
        repository = new JiraFieldRepository(jiraClient, options);
    });

    it("fetches field IDs", async () => {
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
        const id = await repository.getFieldId("Summary");
        expect(id).to.eq("summary");
        expect(stubbedGetFields).to.have.been.calledOnce;
    });

    it("fetches field IDs only for unknown fields", async () => {
        const stubbedGetFields = stub(jiraClient, "getFields").resolves([
            {
                id: "customfield_12345",
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
        await repository.getFieldId("description");
        const id = await repository.getFieldId("summary");
        expect(id).to.eq("customfield_12345");
        expect(stubbedGetFields).to.have.been.calledOnce;
    });

    it("displays an error for fields which do not exist", async () => {
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
        await expect(repository.getFieldId("Damage")).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: Damage
                Make sure to check if your Jira language settings modified the field's name

                Available fields:
                  name: Summary, id: summary
                  name: Description, id: description

                You can provide field translations in the options:

                  jira.fields = {
                    "Damage": {
                      name: // translation of Damage
                    }
                  }
            `)
        );
    });

    it("displays an error when there are multiple fields", async () => {
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
        await expect(repository.getFieldId("Summary")).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: Summary
                There are multiple fields with this name

                Duplicates:
                  id: summary, name: summary, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: summary, schema: [object Object]
                  id: customfield_12345, name: Summary, custom: false, orderable: true, navigable: true, searchable: true, clauseNames: summary (custom), schema: [object Object]

                Make sure to set option jira.fields["Summary"] to the correct ID:

                  jira.fields = {
                    "Summary": {
                      id: // "summary" or "customfield_12345"
                    }
                  }
            `)
        );
    });

    it("handles get field failures gracefully", async () => {
        stub(jiraClient, "getFields").resolves(undefined);
        const stubbedSearch = stub(jiraClient, "search");
        const { stubbedError } = stubLogging();
        const summaries = await repository.getFieldId("CYP-123");
        expect(stubbedSearch).to.not.have.been.called;
        expect(stubbedError).to.have.been.calledOnceWithExactly(
            dedent(`
                    Failed to fetch issue summaries
                    Failed to fetch Jira field ID for field with name: summary
                    Make sure the field actually exists
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
        const summaries = await repository.getFieldId("CYP-123");
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
