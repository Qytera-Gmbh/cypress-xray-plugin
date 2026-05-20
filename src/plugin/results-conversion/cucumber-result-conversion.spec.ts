import assert from "node:assert";
import { relative, resolve } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { stub } from "../../../test/mocks";
import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";
import cucumberResultConversion from "./cucumber-result-conversion";

void describe(relative(cwd(), __filename), () => {
    void describe(cucumberResultConversion.readCucumberReport.name, () => {
        void it("reads cucumber json data", async () => {
            const result = await cucumberResultConversion.readCucumberReport({
                cypress: { config: { projectRoot: "." } },
                options: {
                    cucumber: {
                        reportPath:
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "",
                    elements: [
                        {
                            description: "",
                            id: "a-tagged-feature;something",
                            keyword: "Szenariogrundriss",
                            line: 11,
                            name: "Something",
                            steps: [
                                {
                                    arguments: [],
                                    keyword: "Wenn ",
                                    line: 6,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "user fills username with bob",
                                    result: {
                                        duration: 18000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "Dann ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "a small number is passed 85",
                                    result: {
                                        duration: 11000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [
                                {
                                    line: 4,
                                    name: "@CYP-258",
                                },
                            ],
                            type: "scenario",
                        },
                        {
                            description: "",
                            id: "a-tagged-feature;something",
                            keyword: "Szenariogrundriss",
                            line: 12,
                            name: "Something",
                            steps: [
                                {
                                    arguments: [],
                                    keyword: "Wenn ",
                                    line: 6,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "user fills username with jeff",
                                    result: {
                                        duration: 10000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "Dann ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "a small number is passed 12",
                                    result: {
                                        duration: 10000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [
                                {
                                    line: 4,
                                    name: "@CYP-258",
                                },
                            ],
                            type: "scenario",
                        },
                        {
                            description: "",
                            id: "a-tagged-feature;something",
                            keyword: "Szenariogrundriss",
                            line: 13,
                            name: "Something",
                            steps: [
                                {
                                    arguments: [],
                                    keyword: "Wenn ",
                                    line: 6,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "user fills username with anna",
                                    result: {
                                        duration: 9000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    arguments: [],
                                    embeddings: [
                                        {
                                            data: "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iIiIiIhcrsFbgC9cOE9hwRnOny/FFhxGQGAwzb288PX1I6BNMAGtfSgu+onUwx9XfZK45yxj+gHRt9HDrGY7sPUwhR1jLdtvY+LtkRz9oWYTRBzYerjC2Hj1y4jbMptt9FRu71j1/kayEGAFKamRxFc1HuI9Nr5b/TKrt8Gt8WOAKGwBxeQcs1+n/NnVXCS3O8b8G8PT91TynJP2cdTpfVSte5iN7KxtRkxkWZJ/tzFxguX+oqdye0frPYQRXHCGo7W9DRERERERERGRJqxRZgE+V3yWs0WFBLSxERraHltQW6Ml2Mubc2cPcfjk95zMctEOm7SWnNmLWXCPfYV1ZtkFzPz7VGY/Ub7daWZfd+1bwMxPn2OBtbXWXslmttVWnAXYIxWvV7CH1dsqVvoZDmw9TOEEY9KLA9grIB+2tCsX893fl8GEWIK3vcO8fcC+ZXw3+2FmT3iHmZ9GW66TztGCSi7ilnT2M44FbzwMmBWTlz3nFcz7e5jT+6DA3tZb4b7ee5J5ACywtCsDbCMztOL9lbf/du/fBf/c5BpXeIqIiIiIiIiIXAuaRUT1utRYFw9oHUibNiFcd931NGsGZedLKSw4w7nis5SdL22ssK4YcdMWE/ND5clLV9saRPRUZj/Rhq+raj1uMGYL83saD1BEamdz8lceHR8U6F9HkYiIiIiIiBhy8yqdZaHWGrwF2KogP4+0YwfIyjzGiYyjnMxMpyA/V8k/gLjniO+YTkoV2bWk1XsIvuf1BmtRvlLFTXuYW3OTlfwTEREREREREalCo7QAV3TuXHFjh9D4oqcy+4melNeRGG2uVVbX7VvAzMcbJLIrmn0maBERERERERERqVyjtgCLiIg0NrUAi4iIiIjIlaZJtQCLiIiIiIiIiIhI/VICUEREREREREREpAlTAlBERERERERERKQJUwJQRERERERERESkCVMCUEREREREREREpAlTAlBERERERERERKQJUwJQRERERERERESkCVMCUEREREREREREpAlTAlBERERERERERKQJUwJQRERERERERESkCVMCUEREREREREREpAlTAlBERERERERERKQJUwJQRERERERERESkCVMCUEREREREREREpAlr3tgB1N5tTJz9MLcGOK8t3PYOM7fexuwneuJvX1mwh/kzF3AgeqrT+qOfTmF12Osk3ubrfBL7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WsL4v5tj3102WUPl2yYtHU6XzqMd9zBjQAAF377qRuvyEsavNcbRu+9gCo+x3lIZNpGlIzqXT25x8BkG+hew5S9GVV39PLvniTPHBJxxMIVDfU67XalW63j+mWHO4FvAqS8zHLP5nq5i9ubLj3+YN52u62Hl5Yx7+OgIjvPdcsr6PdeW+d2Y7/nQE/BjHQ5BKSIiIiIiIlLfmkVE9brU0Be9cP5cQ19SRESaqOYtWnp0/OZkzwZlCApUSaiIiIiIiNSt3Ly6HXuqCVQAioiIiIiIiIiISFWUABQREREREREREWnClAAUERERERERERFpwpQAFBERERERERERacKUABQREREREREREWnClAAUERERERERERFpwpQAFBERERERERERacKUABQREREREWkAP1+61NghiIjINap5YwcgIiIiIiLSlJSVXqCwqJjSsvMUFpZQWFTstN3L2/jfMO8WXvj7+xh//HwbI1QREblGKAEoIiIiIiJSB8pKL5CRlU1OTkG1+9n/WVhUDJlGUjA4qDXtwm0NEaqIiFxjlAD00PiJiSxdMr+xwxARERERkUbiKvHn5d0c7xZexj+9WlBadt5xjLUysKz0Aicyc8jOzVciUERE6pwSgCIiIiIiIrV0IjOHE5k5TuvcreazJwELioodyUNrIjC6a5SjXVhERMQT+q+Jh05mZTR2CCIiIiIi0giOHstyqvrz8m5Opw5hbo/n5+XdHJt3ADZbABFhwWTn5juSiWWlF9h3KE1JQBERqROaBdhDu3dtaewQRERERESkge0/cNwp+depQxi9bupc68k8vLyb0y7cRq+bOjsSfvYkYMVJRERERGpKCUAPjRg5prFDEBERERGRBrT/wHFHUs7Luzk9urfHZguok3N7eTcnumuUo324rPQCR49lOSYOERERqQ0lAKVGmvl5NXYIIiIiIiKN5kRmjlPyz5Oqv6rYqwGtScB9h9Lq9BoiInJt0WASHqrNGIDNh3bk+qGdaRbkUw8R1a+fD+VycdcJLm47DmUXGzscEREREZEGU1hU7DThR6cOYfV6veCg1hQWllBYVOyoBKzva4qISNOkCkAP7arFGIBXa/IP4LquQbQYE0Mzr+sbOxQRERERkQZ14kSu4+ce3dvXeeVfRfZJRexjAubkFGg8QBERqRUlAD0UV4sxAK/W5J/VpaKyxg7hihGx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AAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBlZ3vDQCAd7P/OHL0fG8CAADAsFwBCAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBCYAAAAAAUGACIAAAAAAUmAAIAAAAAAUmAAIAAABAgQmAAAAAAFBgAiAAAAAAFJgACAAAAAAFJgACAAAAQIEJgAAAAABQYAIgAAAAABSYAAgAAAAABSYAAgAAAECBjdr32ovnexsAAAAAgD+Ci6ZPyv8PKGKo9SF0yNcAAAAASUVORK5CYII=",
                                            ["mime_type"]: "image/png",
                                        },
                                    ],
                                    keyword: "Dann ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "a small number is passed 1209",
                                    result: {
                                        duration: 277000000,
                                        ["error_message"]: "expected 1209 to be below 100",
                                        status: "failed",
                                    },
                                },
                            ],
                            tags: [
                                {
                                    line: 4,
                                    name: "@CYP-258",
                                },
                            ],
                            type: "scenario",
                        },
                    ],
                    id: "a-tagged-feature",
                    keyword: "Funktionalität",
                    line: 2,
                    name: "A tagged feature",
                    tags: [],
                    uri: "cypress\\e2e\\outline.cy.feature",
                },
                {
                    description: "",
                    elements: [
                        {
                            description: "",
                            id: "a-tagged-feature;tc---development",
                            keyword: "Scenario",
                            line: 9,
                            name: "TC - Development",
                            steps: [
                                {
                                    arguments: [],
                                    embeddings: [
                                        {
                                            data: "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ASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAAAAAAAGBgBIAAAAAAAAGBgBIAAAAAAAACAgREAAgAAAAAAAAZGAAgAAAAAAAAYGAEgAAAAAAAAYGAEgAAAAAAAAICBEQACAAAAAAAABkYACAAAAAAAABgYASAAAAAAAABgYASAAAAAAAAAgIERAAIAAAAAAAAGRgAIAAD+X7t2bAIhFABRUMQOjOX6L8cSDi7WwAauAzP5+JipYOPHAgAAYQIgAAAAAIQJgAAAAAAQJgACAAAAQJgACAAAAABhAiAAAAAAhAmAAAAAABC2jB4AAG92nNfoCQAAALc8AAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAMAEQAAAAAMIEQAAAAAAIEwABAAAAIEwABAAAAIAwARAAAAAAwgRAAAAAAAgTAAEAAAAgTAAEAAAAgDABEAAAAADCBEAAAAAACBMAAQAAACBMAAQAAACAsPn33UdvAAAAAAAe8NnW6Q8SvTM/AQV2wQAAAABJRU5ErkJggg==",
                                            ["mime_type"]: "image/png",
                                        },
                                    ],
                                    keyword: "Given ",
                                    line: 5,
                                    name: "abc123",
                                    result: {
                                        duration: 0,
                                        status: "undefined",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "Then ",
                                    line: 6,
                                    name: "xyz9871",
                                    result: {
                                        duration: 0,
                                        status: "skipped",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "Given ",
                                    line: 10,
                                    name: "an assumption",
                                    result: {
                                        duration: 0,
                                        status: "skipped",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "When ",
                                    line: 11,
                                    name: "a when",
                                    result: {
                                        duration: 0,
                                        status: "skipped",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "And ",
                                    line: 12,
                                    name: "an and",
                                    result: {
                                        duration: 0,
                                        status: "skipped",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "Then ",
                                    line: 13,
                                    name: "a then",
                                    result: {
                                        duration: 0,
                                        status: "skipped",
                                    },
                                },
                            ],
                            tags: [
                                {
                                    line: 8,
                                    name: "@ABC-63",
                                },
                            ],
                            type: "scenario",
                        },
                    ],
                    id: "a-tagged-feature",
                    keyword: "Feature",
                    line: 1,
                    name: "A tagged feature",
                    tags: [],
                    uri: "cypress\\e2e\\spec.cy.feature",
                },
            ]);
        });

        void it("reads cucumber json data with respect to the cypress project root", async () => {
            const result = await cucumberResultConversion.readCucumberReport({
                cypress: { config: { projectRoot: "./test/resources" } },
                options: {
                    cucumber: {
                        reportPath:
                            "./fixtures/xray/requests/importExecutionCucumberMultipartUntagged.json",
                    },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-stuff",
                            keyword: "Scenario",
                            line: 6,
                            name: "",
                            steps: [
                                {
                                    arguments: [],
                                    keyword: "When ",
                                    line: 4,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I prepare something",
                                    result: {
                                        duration: 25000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "When ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    arguments: [],
                                    keyword: "Then ",
                                    line: 8,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    uri: "cypress/e2e/features/example.feature",
                },
            ]);
        });

        void it("fails if the report path has not been configured", async () => {
            await assert.rejects(
                () =>
                    cucumberResultConversion.readCucumberReport({
                        cypress: { config: { projectRoot: "./test/resources" } },
                        options: {},
                    }),
                new Error(
                    "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured."
                )
            );
        });
    });

    void describe(cucumberResultConversion.convertCucumberFeatures.name, () => {
        void it("does not do anything if no feature files were executed", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: {
                        prefixes: {
                            test: "TestName:",
                        },
                    },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: true },
                },
            });
            assert.deepStrictEqual(result, []);
        });

        void it("does not do anything if empty feature files were executed", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "a feature file",
                        elements: [],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                    {
                        description: "another feature file",
                        elements: [],
                        id: "example2",
                        keyword: "Feature",
                        line: 1,
                        name: "Example 2",
                        uri: "cypress/e2e/features/example2.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: {
                        prefixes: {
                            test: "TestName:",
                        },
                    },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: true },
                },
            });
            assert.deepStrictEqual(result, []);
        });

        void it("converts cucumber results into cucumber features data", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "a feature file",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 6,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 4,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I prepare something",
                                        result: {
                                            duration: 25000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 8,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [{ name: "@CYP-258" }],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: {
                        prefixes: {},
                    },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "a feature file",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-stuff",
                            keyword: "Scenario",
                            line: 6,
                            name: "",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 4,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I prepare something",
                                    result: {
                                        duration: 25000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 8,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [{ name: "@CYP-258" }],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    uri: "cypress/e2e/features/example.feature",
                },
            ]);
        });

        void it("converts cucumber results into prefixed cucumber features data", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "a feature file",
                        elements: [
                            {
                                description: "",
                                id: "a-tagged-feature;something",
                                keyword: "Szenariogrundriss",
                                line: 12,
                                name: "Something",
                                steps: [
                                    {
                                        keyword: "Wenn ",
                                        line: 6,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "user fills username with jeff",
                                        result: {
                                            duration: 10000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        keyword: "Dann ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "a small number is passed 12",
                                        result: {
                                            duration: 10000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [
                                    {
                                        line: 4,
                                        name: "@TestName:CYP-258",
                                    },
                                ],
                                type: "scenario",
                            },
                            {
                                description: "",
                                id: "a-tagged-feature;something",
                                keyword: "Szenariogrundriss",
                                line: 13,
                                name: "Something",
                                steps: [
                                    {
                                        keyword: "Wenn ",
                                        line: 6,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "user fills username with anna",
                                        result: {
                                            duration: 9000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [
                                            {
                                                data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                                ["mime_type"]: "image/png",
                                            },
                                        ],
                                        keyword: "Dann ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "a small number is passed 1209",
                                        result: {
                                            duration: 277000000,
                                            ["error_message"]: "expected 1209 to be below 100",
                                            status: "failed",
                                        },
                                    },
                                ],
                                tags: [
                                    {
                                        line: 4,
                                        name: "@TestName:CYP-258",
                                    },
                                ],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: {
                        prefixes: { test: "TestName:" },
                    },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "a feature file",
                    elements: [
                        {
                            description: "",
                            id: "a-tagged-feature;something",
                            keyword: "Szenariogrundriss",
                            line: 12,
                            name: "Something",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "Wenn ",
                                    line: 6,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "user fills username with jeff",
                                    result: {
                                        duration: 10000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Dann ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "a small number is passed 12",
                                    result: {
                                        duration: 10000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [
                                {
                                    line: 4,
                                    name: "@TestName:CYP-258",
                                },
                            ],
                            type: "scenario",
                        },
                        {
                            description: "",
                            id: "a-tagged-feature;something",
                            keyword: "Szenariogrundriss",
                            line: 13,
                            name: "Something",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "Wenn ",
                                    line: 6,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "user fills username with anna",
                                    result: {
                                        duration: 9000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Dann ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "a small number is passed 1209",
                                    result: {
                                        duration: 277000000,
                                        ["error_message"]: "expected 1209 to be below 100",
                                        status: "failed",
                                    },
                                },
                            ],
                            tags: [
                                {
                                    line: 4,
                                    name: "@TestName:CYP-258",
                                },
                            ],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    uri: "cypress/e2e/features/example.feature",
                },
            ]);
        });

        void it("prefers the cypress test execution issue key", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "a feature file",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 6,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 4,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I prepare something",
                                        result: {
                                            duration: 25000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 8,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [{ name: "@Scenario_CYP-123" }],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                cypressResultExecutionIssueKey: "ABC-123",
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: {
                        prefixes: { test: "Scenario_" },
                    },
                    jira: { projectKey: "CYP", testExecutionIssue: { key: "CYP-456" } },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "a feature file",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-stuff",
                            keyword: "Scenario",
                            line: 6,
                            name: "",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 4,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I prepare something",
                                    result: {
                                        duration: 25000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 8,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [{ name: "@Scenario_CYP-123" }],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    tags: [{ name: "@ABC-123" }],
                    uri: "cypress/e2e/features/example.feature",
                },
            ]);
        });

        void it("uses the configured test execution issue key", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "a feature file",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 6,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 4,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I prepare something",
                                        result: {
                                            duration: 25000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 8,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [{ name: "@Scenario_CYP-123" }],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        tags: [{ name: "@smoke" }],
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: {
                        prefixes: { test: "Scenario_" },
                    },
                    jira: { projectKey: "CYP", testExecutionIssue: { key: "XYZ-456" } },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "a feature file",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-stuff",
                            keyword: "Scenario",
                            line: 6,
                            name: "",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 4,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I prepare something",
                                    result: {
                                        duration: 25000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 8,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [{ name: "@Scenario_CYP-123" }],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    tags: [{ name: "@XYZ-456" }, { name: "@smoke" }],
                    uri: "cypress/e2e/features/example.feature",
                },
            ]);
        });

        void it("includes screenshots if enabled", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "a feature file",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 6,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [
                                            { data: "aGkgdGhlcmU=", ["mime_type"]: "text/plain" },
                                        ],
                                        keyword: "When ",
                                        line: 4,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I prepare something",
                                        result: {
                                            duration: 25000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [
                                            { data: "Z29vZGJ5ZQ==", ["mime_type"]: "text/plain" },
                                            { data: "aGkgdGhlcmU=", ["mime_type"]: "text/plain" },
                                        ],
                                        keyword: "Then ",
                                        line: 8,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [{ name: "@CYP-987" }],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: messageMock },
                options: {
                    cucumber: {
                        prefixes: {},
                    },
                    jira: { projectKey: "CYP", testExecutionIssue: { key: "XYZ-456" } },
                    xray: { uploadScreenshots: true },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "a feature file",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-stuff",
                            keyword: "Scenario",
                            line: 6,
                            name: "",
                            steps: [
                                {
                                    embeddings: [
                                        { data: "aGkgdGhlcmU=", ["mime_type"]: "text/plain" },
                                    ],
                                    keyword: "When ",
                                    line: 4,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I prepare something",
                                    result: {
                                        duration: 25000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [
                                        { data: "Z29vZGJ5ZQ==", ["mime_type"]: "text/plain" },
                                        { data: "aGkgdGhlcmU=", ["mime_type"]: "text/plain" },
                                    ],
                                    keyword: "Then ",
                                    line: 8,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [{ name: "@CYP-987" }],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    tags: [{ name: "@XYZ-456" }],
                    uri: "cypress/e2e/features/example.feature",
                },
            ]);
        });

        void it("respects custom statuses", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "a-tagged-feature;tc---development",
                                keyword: "Scenario",
                                line: 9,
                                name: "TC - Development",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "Given ",
                                        line: 5,
                                        name: "abc123",
                                        result: {
                                            duration: 0,
                                            status: "undefined",
                                        },
                                    },
                                    {
                                        keyword: "Then ",
                                        line: 6,
                                        name: "xyz9871",
                                        result: {
                                            duration: 0,
                                            status: "skipped",
                                        },
                                    },
                                    {
                                        keyword: "Given ",
                                        line: 10,
                                        name: "an assumption",
                                        result: {
                                            duration: 0,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        keyword: "When ",
                                        line: 11,
                                        name: "a when",
                                        result: {
                                            duration: 0,
                                            status: "unknown",
                                        },
                                    },
                                    {
                                        keyword: "And ",
                                        line: 12,
                                        name: "an and",
                                        result: {
                                            duration: 0,
                                            status: "failed",
                                        },
                                    },
                                    {
                                        keyword: "Then ",
                                        line: 13,
                                        name: "a then",
                                        result: {
                                            duration: 0,
                                            status: "pending",
                                        },
                                    },
                                ],
                                tags: [
                                    {
                                        line: 8,
                                        name: "@ABC-63",
                                    },
                                    {
                                        line: 67,
                                        name: "@CYP-123",
                                    },
                                ],
                                type: "scenario",
                            },
                        ],
                        id: "a-tagged-feature",
                        keyword: "Feature",
                        line: 1,
                        name: "A tagged feature",
                        tags: [],
                        uri: "cypress/e2e/spec.cy.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: {
                        prefixes: {},
                    },
                    jira: { projectKey: "CYP" },
                    xray: {
                        status: {
                            step: {
                                failed: "DID FAIL",
                                passed: "DID PASS",
                                pending: "IS PENDING",
                                skipped: "WAS SKIPPED",
                            },
                        },
                        uploadScreenshots: false,
                    },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "",
                    elements: [
                        {
                            description: "",
                            id: "a-tagged-feature;tc---development",
                            keyword: "Scenario",
                            line: 9,
                            name: "TC - Development",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "Given ",
                                    line: 5,
                                    name: "abc123",
                                    result: {
                                        duration: 0,
                                        status: "undefined",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 6,
                                    name: "xyz9871",
                                    result: {
                                        duration: 0,
                                        status: "WAS SKIPPED",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Given ",
                                    line: 10,
                                    name: "an assumption",
                                    result: {
                                        duration: 0,
                                        status: "DID PASS",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 11,
                                    name: "a when",
                                    result: {
                                        duration: 0,
                                        status: "unknown",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "And ",
                                    line: 12,
                                    name: "an and",
                                    result: {
                                        duration: 0,
                                        status: "DID FAIL",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 13,
                                    name: "a then",
                                    result: {
                                        duration: 0,
                                        status: "IS PENDING",
                                    },
                                },
                            ],
                            tags: [
                                {
                                    line: 8,
                                    name: "@ABC-63",
                                },
                                {
                                    line: 67,
                                    name: "@CYP-123",
                                },
                            ],
                            type: "scenario",
                        },
                    ],
                    id: "a-tagged-feature",
                    keyword: "Feature",
                    line: 1,
                    name: "A tagged feature",
                    tags: [],
                    uri: "cypress/e2e/spec.cy.feature",
                },
            ]);
        });

        void it("skips background elements", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff-background",
                                keyword: "Background",
                                line: 123,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 124,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I prepare something",
                                        result: {
                                            duration: 25000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                type: "background",
                            },
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 130,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 131,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 132,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [{ name: "@CYP-456" }],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: { prefixes: {} },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-stuff",
                            keyword: "Scenario",
                            line: 130,
                            name: "",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 131,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 132,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [{ name: "@CYP-456" }],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    uri: "cypress/e2e/features/example.feature",
                },
            ]);
        });

        void it("skips embeddings if screenshots are disabled", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 130,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [
                                            { data: "aGkgdGhlcmU=", ["mime_type"]: "text/plain" },
                                        ],
                                        keyword: "When ",
                                        line: 131,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 132,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [{ name: "@CYP-123" }],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-other-stuff",
                                keyword: "Scenario",
                                line: 130,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 131,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [
                                            { data: "aGkgdGhlcmU=", ["mime_type"]: "text/plain" },
                                        ],
                                        keyword: "Then ",
                                        line: 132,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [{ name: "@CYP-456" }],
                                type: "scenario",
                            },
                        ],
                        id: "other-example",
                        keyword: "Feature",
                        line: 1,
                        name: "Other Example",
                        uri: "cypress/e2e/features/other-example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "." } },
                isCloudEnvironment: true,
                logger: { message: stub() },
                options: {
                    cucumber: { prefixes: {} },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-stuff",
                            keyword: "Scenario",
                            line: 130,
                            name: "",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 131,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 132,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [{ name: "@CYP-123" }],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    uri: "cypress/e2e/features/example.feature",
                },
                {
                    description: "",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-other-stuff",
                            keyword: "Scenario",
                            line: 130,
                            name: "",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 131,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 132,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [{ name: "@CYP-456" }],
                            type: "scenario",
                        },
                    ],
                    id: "other-example",
                    keyword: "Feature",
                    line: 1,
                    name: "Other Example",
                    uri: "cypress/e2e/features/other-example.feature",
                },
            ]);
        });

        void it("skips untagged scenarios without name", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 6,
                                name: "",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 4,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I prepare something",
                                        result: {
                                            duration: 25000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 8,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "./test/resources" } },
                isCloudEnvironment: true,
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: {} },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                          ${resolve(
                              ".",
                              "test",
                              "resources",
                              "cypress",
                              "e2e",
                              "features",
                              "example.feature"
                          )}

                            Scenario: <no name>

                              Skipping result upload.

                                Caused by: Scenario: <no name>

                                  No test issue keys found in tags.

                                  You can target existing test issues by adding a corresponding tag:

                                    @CYP-123
                                    Scenario:
                                      When I prepare something
                                      ...

                                  You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                                    Plugin configuration:

                                      {
                                        cucumber: {
                                          prefixes: {
                                            test: "TestName:"
                                          }
                                        }
                                      }

                                    Feature file:

                                      @TestName:CYP-123
                                      Scenario:
                                        When I prepare something
                                        ...

                                  For more information, visit:
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                                  - https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                      `),
                    ],
                ]
            );
        });

        void it("skips untagged scenarios", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 6,
                                name: "My scenario",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 4,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I prepare something",
                                        result: {
                                            duration: 25000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 8,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "./test/resources" } },
                isCloudEnvironment: false,
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: {} },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                          ${resolve(
                              ".",
                              "test",
                              "resources",
                              "cypress",
                              "e2e",
                              "features",
                              "example.feature"
                          )}

                            Scenario: My scenario

                              Skipping result upload.

                                Caused by: Scenario: My scenario

                                  No test issue keys found in tags.

                                  You can target existing test issues by adding a corresponding tag:

                                    @CYP-123
                                    Scenario: My scenario
                                      When I prepare something
                                      ...

                                  You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                                    Plugin configuration:

                                      {
                                        cucumber: {
                                          prefixes: {
                                            test: "TestName:"
                                          }
                                        }
                                      }

                                    Feature file:

                                      @TestName:CYP-123
                                      Scenario: My scenario
                                        When I prepare something
                                        ...

                                  For more information, visit:
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                                  - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                      `),
                    ],
                ]
            );
        });

        void it("skips scenarios without recognised issue tags", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "a-tagged-feature;something",
                                keyword: "Szenariogrundriss",
                                line: 11,
                                name: "Something",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "Wenn ",
                                        line: 6,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "user fills username with bob",
                                        result: {
                                            duration: 18000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Dann ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "a small number is passed 85",
                                        result: {
                                            duration: 11000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [
                                    {
                                        line: 4,
                                        name: "@CYP-258",
                                    },
                                ],
                                type: "scenario",
                            },
                        ],
                        id: "a-tagged-feature",
                        keyword: "Funktionalität",
                        line: 2,
                        name: "A tagged feature",
                        tags: [],
                        uri: "cypress/e2e/outline.cy.feature",
                    },
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "a-tagged-feature;tc---development",
                                keyword: "Scenario",
                                line: 9,
                                name: "TC - Development",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "Given ",
                                        line: 5,
                                        name: "abc123",
                                        result: {
                                            duration: 0,
                                            status: "undefined",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 6,
                                        name: "xyz9871",
                                        result: {
                                            duration: 0,
                                            status: "skipped",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Given ",
                                        line: 10,
                                        name: "an assumption",
                                        result: {
                                            duration: 0,
                                            status: "skipped",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 11,
                                        name: "a when",
                                        result: {
                                            duration: 0,
                                            status: "skipped",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "And ",
                                        line: 12,
                                        name: "an and",
                                        result: {
                                            duration: 0,
                                            status: "skipped",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 13,
                                        name: "a then",
                                        result: {
                                            duration: 0,
                                            status: "skipped",
                                        },
                                    },
                                ],
                                tags: [
                                    {
                                        line: 8,
                                        name: "@ABC-63",
                                    },
                                    {
                                        line: 8,
                                        name: "@TestName:CYP-123",
                                    },
                                ],
                                type: "scenario",
                            },
                        ],
                        id: "a-tagged-feature",
                        keyword: "Feature",
                        line: 1,
                        name: "A tagged feature",
                        tags: [],
                        uri: "cypress/e2e/spec.cy.feature",
                    },
                ],
                cypress: { config: { projectRoot: "./test/resources" } },
                isCloudEnvironment: false,
                logger: { message: messageMock },
                options: {
                    cucumber: { prefixes: { test: "MyPrefix:" } },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, []);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                          ${resolve(
                              ".",
                              "test",
                              "resources",
                              "cypress",
                              "e2e",
                              "outline.cy.feature"
                          )}

                            Scenario: Something

                              Skipping result upload.

                                Caused by: Scenario: Something

                                  No test issue keys found in tags:

                                    @CYP-258

                                  If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray.

                                    For example, with the following plugin configuration:

                                      {
                                        cucumber: {
                                          prefixes: {
                                            test: "TestName:"
                                          }
                                        }
                                      }

                                    The following tag will be recognized as a test issue tag by the plugin:

                                      @TestName:CYP-123
                                      Szenariogrundriss: Something
                                        Wenn user fills username with bob
                                        ...

                                  For more information, visit:
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                                  - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                      `),
                    ],
                    [
                        "warning",
                        dedent(`
                          ${resolve(".", "test", "resources", "cypress", "e2e", "spec.cy.feature")}

                            Scenario: TC - Development

                              Skipping result upload.

                                Caused by: Scenario: TC - Development

                                  No test issue keys found in tags:

                                    @ABC-63
                                    @TestName:CYP-123

                                  If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray.

                                    For example, with the following plugin configuration:

                                      {
                                        cucumber: {
                                          prefixes: {
                                            test: "TestName:"
                                          }
                                        }
                                      }

                                    The following tag will be recognized as a test issue tag by the plugin:

                                      @TestName:CYP-123
                                      Scenario: TC - Development
                                        Given abc123
                                        ...

                                  For more information, visit:
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                                  - https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                      `),
                    ],
                ]
            );
        });

        void it("includes scenarios with multiple tags", () => {
            const result = cucumberResultConversion.convertCucumberFeatures({
                cucumberResults: [
                    {
                        description: "",
                        elements: [
                            {
                                description: "",
                                id: "example;doing-stuff",
                                keyword: "Scenario",
                                line: 6,
                                name: "Doing stuff",
                                steps: [
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 4,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I prepare something",
                                        result: {
                                            duration: 25000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "When ",
                                        line: 7,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "I do something",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                    {
                                        embeddings: [],
                                        keyword: "Then ",
                                        line: 8,
                                        match: {
                                            location: "not available:0",
                                        },
                                        name: "something happens",
                                        result: {
                                            duration: 15000000,
                                            status: "passed",
                                        },
                                    },
                                ],
                                tags: [
                                    {
                                        line: 4,
                                        name: "@TestName:CYP-123",
                                    },
                                    {
                                        line: 4,
                                        name: "@TestName:CYP-456",
                                    },
                                ],
                                type: "scenario",
                            },
                        ],
                        id: "example",
                        keyword: "Feature",
                        line: 1,
                        name: "Example",
                        tags: [],
                        uri: "cypress/e2e/features/example.feature",
                    },
                ],
                cypress: { config: { projectRoot: "./test/resources" } },
                isCloudEnvironment: false,
                logger: { message: stub() },
                options: {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: { projectKey: "CYP" },
                    xray: { uploadScreenshots: false },
                },
            });
            assert.deepStrictEqual(result, [
                {
                    description: "",
                    elements: [
                        {
                            description: "",
                            id: "example;doing-stuff",
                            keyword: "Scenario",
                            line: 6,
                            name: "Doing stuff",
                            steps: [
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 4,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I prepare something",
                                    result: {
                                        duration: 25000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "When ",
                                    line: 7,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "I do something",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                                {
                                    embeddings: [],
                                    keyword: "Then ",
                                    line: 8,
                                    match: {
                                        location: "not available:0",
                                    },
                                    name: "something happens",
                                    result: {
                                        duration: 15000000,
                                        status: "passed",
                                    },
                                },
                            ],
                            tags: [
                                {
                                    line: 4,
                                    name: "@TestName:CYP-123",
                                },
                                {
                                    line: 4,
                                    name: "@TestName:CYP-456",
                                },
                            ],
                            type: "scenario",
                        },
                    ],
                    id: "example",
                    keyword: "Feature",
                    line: 1,
                    name: "Example",
                    tags: [],
                    uri: "cypress/e2e/features/example.feature",
                },
            ]);
        });
    });
});
