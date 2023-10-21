import { expect } from "chai";
import { prettyPadObjects } from "./pretty";

describe("pretty", () => {
    describe("prettyPadObjects", () => {
        it("pretty pad object arrays", () => {
            const array = [
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
            ];
            expect(prettyPadObjects(array)).to.deep.eq([
                {
                    id: '"summary"    ',
                    name: '"Summary"    ',
                    custom: "false",
                    orderable: "true",
                    navigable: "true",
                    searchable: "true",
                    clauseNames: '["summary"]    ',
                    schema: '{"type":"string","system":"summary"}    ',
                },
                {
                    id: '"description"',
                    name: '"Description"',
                    custom: "false",
                    orderable: "true",
                    navigable: "true",
                    searchable: "true",
                    clauseNames: '["description"]',
                    schema: '{"type":"string","system":"description"}',
                },
            ]);
        });
    });
});
