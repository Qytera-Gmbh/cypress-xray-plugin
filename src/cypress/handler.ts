import { normalizedFilename } from "../util/files";

/**
 * Handles a `cy.request` call. The event handler stores the request with its parameters as well as
 * the response for later upload to the Xray test execution issue.
 *
 * @param command - the command
 * @param args - the command parameters
 * @returns the response
 */
export default function on(
    command: "cy.request",
    ...args: HandleParameterType["cy.request"]
): HandleReturnType["cy.request"];
export default function on(
    command: OverwrittenCommand,
    ...args: HandleParameterType[OverwrittenCommand]
): HandleReturnType[OverwrittenCommand] {
    switch (command) {
        case "cy.request": {
            return onCyRequest(args[0], args[1]);
        }
    }
}

type OverwrittenCommand = "cy.request";

interface HandleParameterType {
    ["cy.request"]: [
        originalFn: Cypress.CommandOriginalFn<"request">,
        options: Partial<Cypress.RequestOptions>
    ];
}

interface HandleReturnType {
    ["cy.request"]: Cypress.Chainable<Cypress.Response<unknown>>;
}

function onCyRequest(...args: HandleParameterType["cy.request"]): HandleReturnType["cy.request"] {
    const originalFn = args[0];
    const options = args[1];
    const currentTest = Cypress.currentTest;
    const filename = toFilename(options);
    return cy
        .task("task:request", { test: currentTest.title, filename: filename, request: options })
        .then(() => originalFn(options))
        .then((response) => {
            cy.task("task:response", {
                test: currentTest.title,
                filename: filename,
                response: response,
            });
            return cy.wrap(response);
        });
}

function toFilename(request: Partial<Cypress.RequestOptions>): string {
    const method = typeof request === "string" ? "GET" : request.method ?? "UNKNOWN METHOD";
    const url = typeof request === "string" ? request : request.url ?? "UNKNOWN URL";
    const timestamp = normalizedFilename(new Date().toLocaleTimeString());
    return `${method} ${url} ${timestamp}`;
}
