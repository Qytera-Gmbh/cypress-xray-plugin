import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { prettyPadObjects, prettyPadValues } from "./pretty";

void describe(relative(cwd(), __filename), () => {
    void describe(prettyPadObjects.name, () => {
        void it("pretty pad object arrays", () => {
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
            assert.deepStrictEqual(prettyPadObjects(array), [
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
        void it("pretty pad object values", () => {
            assert.deepStrictEqual(
                prettyPadValues({
                    a: [1, 2, false, true, "george"],
                    somethingLong: {
                        i: 1,
                        j: 2,
                        k: "snake",
                    },
                    x: 12345,
                    y: "hello gooood Morning",
                }),
                {
                    a: '[1,2,false,true,"george"]',
                    somethingLong: '{"i":1,"j":2,"k":"snake"}',
                    x: "12345                    ",
                    y: '"hello gooood Morning"   ',
                }
            );
        });
    });
});
