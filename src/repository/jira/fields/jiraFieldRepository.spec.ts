import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { stub } from "sinon";
import { BasicAuthCredentials } from "../../../authentication/credentials";
import { JiraClientServer } from "../../../client/jira/jiraClientServer";
import { dedent } from "../../../util/dedent";
import { CachingJiraFieldRepository } from "./jiraFieldRepository";
import { SupportedFields } from "./jiraIssueFetcher";

chai.use(chaiAsPromised);

describe("the jira field repository", () => {
    let jiraClient: JiraClientServer;
    let repository: CachingJiraFieldRepository;

    beforeEach(() => {
        jiraClient = new JiraClientServer(
            "https://example.org",
            new BasicAuthCredentials("user", "xyz")
        );
        repository = new CachingJiraFieldRepository(jiraClient);
    });

    it("fetches fields case-insensitively", async () => {
        stub(jiraClient, "getFields").resolves([
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
        ]);
        const id = await repository.getFieldId(SupportedFields.SUMMARY);
        expect(id).to.eq("customfield_12345");
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
        await repository.getFieldId(SupportedFields.DESCRIPTION);
        const id = await repository.getFieldId(SupportedFields.SUMMARY);
        expect(id).to.eq("customfield_12345");
        expect(stubbedGetFields).to.have.been.calledOnce;
    });

    it("throws for missing descriptions", async () => {
        stub(jiraClient, "getFields").resolves([]);
        await expect(
            repository.getFieldId(SupportedFields.DESCRIPTION)
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: description
                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                You can provide field IDs directly without relying on language settings:

                  jira: {
                    fields: {
                      description: // corresponding field ID
                    }
                  }
            `)
        );
    });

    it("throws for missing labels", async () => {
        stub(jiraClient, "getFields").resolves([]);
        await expect(repository.getFieldId(SupportedFields.LABELS)).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: labels
                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                You can provide field IDs directly without relying on language settings:

                  jira: {
                    fields: {
                      labels: // corresponding field ID
                    }
                  }
            `)
        );
    });

    it("throws for missing test environments", async () => {
        stub(jiraClient, "getFields").resolves([]);
        await expect(
            repository.getFieldId(SupportedFields.TEST_ENVIRONMENTS)
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: test environments
                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                You can provide field IDs directly without relying on language settings:

                  jira: {
                    fields: {
                      testEnvironments: // corresponding field ID
                    }
                  }
            `)
        );
    });

    it("throws for missing test types", async () => {
        stub(jiraClient, "getFields").resolves([]);
        await expect(
            repository.getFieldId(SupportedFields.TEST_TYPE)
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: test type
                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                You can provide field IDs directly without relying on language settings:

                  jira: {
                    fields: {
                      testType: // corresponding field ID
                    }
                  }
            `)
        );
    });

    it("throws for missing fields and displays a hint", async () => {
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
        await expect(
            repository.getFieldId(SupportedFields.TEST_PLAN)
        ).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: test plan
                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                Available fields:
                  name: "Description" id: "description"
                  name: "Summary"     id: "summary"

                You can provide field IDs directly without relying on language settings:

                  jira: {
                    fields: {
                      testPlan: // corresponding field ID
                    }
                  }
            `)
        );
    });

    it("throws for multiple fields", async () => {
        const fields = [
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
        ];
        stub(jiraClient, "getFields").resolves(fields);
        await expect(repository.getFieldId(SupportedFields.SUMMARY)).to.eventually.be.rejectedWith(
            dedent(`
                Failed to fetch Jira field ID for field with name: summary
                There are multiple fields with this name

                Duplicates:
                  id: "customfield_12345", name: "Summary", custom: false, orderable: true, navigable: true, searchable: true, clauseNames: ["summary (custom)"], schema: {"type":"string","customId":5125}
                  id: "summary"          , name: "summary", custom: false, orderable: true, navigable: true, searchable: true, clauseNames: ["summary"]         , schema: {"type":"string","system":"summary"}

                You can provide field IDs in the options:

                  jira: {
                    fields: {
                      summary: // "summary" or "customfield_12345"
                    }
                  }
            `)
        );
    });

    it("throws for total field fetch failures", async () => {
        stub(jiraClient, "getFields").resolves(undefined);
        await expect(repository.getFieldId(SupportedFields.SUMMARY)).to.eventually.be.rejectedWith(
            "Failed to fetch Jira field ID for field with name: summary"
        );
    });
});
