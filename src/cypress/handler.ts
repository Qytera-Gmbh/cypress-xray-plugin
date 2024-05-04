import { getPluginContext } from "../context";
import { LOG, Level } from "../logging/logging";
import { showInitializationWarnings } from "../plugin";
import { dedent } from "../util/dedent";
import { HELP } from "../util/help";

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
    const context = getPluginContext();
    if (!context) {
        if (showInitializationWarnings()) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    Skipping cy.request listener in ${currentTest.title}: Plugin misconfigured: configureXrayPlugin() was not called

                    Make sure your project is set up correctly: ${HELP.plugin.configuration.introduction}
                `)
            );
        }
        return originalFn(options);
    }
    context.addRequest(currentTest.title, args[1]);
    return originalFn(options).then((response) => {
        context.addResponse(currentTest.title, response);
        return response;
    });
}
