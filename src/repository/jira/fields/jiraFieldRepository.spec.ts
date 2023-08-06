import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { stub } from "sinon";
import { BasicAuthCredentials } from "../../../authentication/credentials";
import { JiraClientServer } from "../../../client/jira/jiraClientServer";
import { initOptions } from "../../../context";
import { FieldDetailCloud, FieldDetailServer } from "../../../types/jira/responses/fieldDetail";
import { InternalOptions } from "../../../types/plugin";
import { JiraFieldRepository } from "./jiraFieldRepository";

chai.use(chaiAsPromised);

describe("the jira field repository", () => {
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

    it("fetches fields case-insensitively", async () => {
        stub(jiraClient, "getFields").resolves([
            {
                id: "customfield_12345",
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
        const id = await repository.getFieldId("SuMmArY");
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
        await repository.getFieldId("description");
        const id = await repository.getFieldId("summary");
        expect(id).to.eq("customfield_12345");
        expect(stubbedGetFields).to.have.been.calledOnce;
    });

    it("calls the missing fields callback", async () => {
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
        const callbacks = {
            onMissingFieldError: (availableFields: string[]) => {
                expect(availableFields).to.deep.eq([
                    "name: Summary, id: summary",
                    "name: Description, id: description",
                ]);
            },
        };
        const callback = stub(callbacks, "onMissingFieldError");
        const id = await repository.getFieldId("Damage", { onMissingFieldError: callback });
        expect(id).to.be.undefined;
        expect(callback).to.have.been.calledOnce;
    });

    it("calls the multiple fields callback", async () => {
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
        const callbacks = {
            onMultipleFieldsError: (duplicates: FieldDetailServer[] | FieldDetailCloud[]) => {
                expect(duplicates).to.deep.eq(fields);
            },
        };
        const callback = stub(callbacks, "onMultipleFieldsError");
        const id = await repository.getFieldId("Summary", { onMultipleFieldsError: callback });
        expect(id).to.be.undefined;
        expect(callback).to.have.been.calledOnce;
    });

    it("handles get field failures gracefully", async () => {
        stub(jiraClient, "getFields").resolves(undefined);
        const callbacks = {
            onFetchError: () => {
                expect(true).to.eq(true);
            },
        };
        const callback = stub(callbacks, "onFetchError");
        const id = await repository.getFieldId("Summary", { onFetchError: callback });
        expect(id).to.be.undefined;
        expect(callback).to.have.been.calledOnce;
    });
});
