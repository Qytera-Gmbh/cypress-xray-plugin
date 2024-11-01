import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { prettyPadObjects, prettyPadValues } from "./pretty.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(prettyPadObjects.name, async () => {
        await it("pretty pad object arrays", () => {
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
        await it("pretty pad object values", () => {
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
