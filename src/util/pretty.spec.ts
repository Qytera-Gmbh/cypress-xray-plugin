import { expect } from "chai";
import { prettyPadObjects, prettyPadValues } from "./pretty";

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
                    orderable: true,
                    name: "Description",
                    schema: {
                        type: "string",
                        system: "description",
                    },
                    individualProperty: "I'm a space traveller",
                    custom: false,
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
                    clauseNames: '["summary"]',
                    schema: '{"type":"string","system":"summary"}    ',
                },
                {
                    id: '"description"',
                    name: '"Description"',
                    custom: "false",
                    orderable: "true",
                    individualProperty: '"I\'m a space traveller"',
                    schema: '{"type":"string","system":"description"}',
                },
            ]);
        });
        it("pretty pad object values", () => {
            expect(
                prettyPadValues({
                    x: 12345,
                    a: [1, 2, false, true, "george"],
                    y: "hello gooood Morning",
                    somethingLong: {
                        i: 1,
                        j: 2,
                        k: "snake",
                    },
                })
            ).to.deep.eq({
                x: "12345                    ",
                a: '[1,2,false,true,"george"]',
                y: '"hello gooood Morning"   ',
                somethingLong: '{"i":1,"j":2,"k":"snake"}',
            });
        });
    });
});
