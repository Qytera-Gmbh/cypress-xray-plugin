import { expect } from "chai";
import path from "path";
import { prettyPadObjects, prettyPadValues } from "./pretty";

describe(path.relative(process.cwd(), __filename), () => {
    describe(prettyPadObjects.name, () => {
        it("pretty pad object arrays", () => {
            const array = [
                {
                    clauseNames: ["summary"],
                    custom: false,
                    id: "summary",
                    name: "Summary",
                    navigable: true,
                    orderable: true,
                    schema: {
                        system: "summary",
                        type: "string",
                    },
                    searchable: true,
                },
                {
                    custom: false,
                    id: "description",
                    individualProperty: "I'm a space traveller",
                    name: "Description",
                    orderable: true,
                    schema: {
                        system: "description",
                        type: "string",
                    },
                },
            ];
            expect(prettyPadObjects(array)).to.deep.eq([
                {
                    clauseNames: '["summary"]',
                    custom: "false",
                    id: '"summary"    ',
                    name: '"Summary"    ',
                    navigable: "true",
                    orderable: "true",
                    schema: '{"system":"summary","type":"string"}    ',
                    searchable: "true",
                },
                {
                    custom: "false",
                    id: '"description"',
                    individualProperty: '"I\'m a space traveller"',
                    name: '"Description"',
                    orderable: "true",
                    schema: '{"system":"description","type":"string"}',
                },
            ]);
        });
        it("pretty pad object values", () => {
            expect(
                prettyPadValues({
                    a: [1, 2, false, true, "george"],
                    somethingLong: {
                        i: 1,
                        j: 2,
                        k: "snake",
                    },
                    x: 12345,
                    y: "hello gooood Morning",
                })
            ).to.deep.eq({
                a: '[1,2,false,true,"george"]',
                somethingLong: '{"i":1,"j":2,"k":"snake"}',
                x: "12345                    ",
                y: '"hello gooood Morning"   ',
            });
        });
    });
});
