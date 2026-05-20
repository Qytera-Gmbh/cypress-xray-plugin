import { normalizedFilename } from "../util/files";
import { enqueueTask } from "./tasks";

Cypress.Commands.overwrite(
    "request",
    (
        originalFn: Cypress.CommandOriginalFn<"request">,
        request: Partial<Cypress.RequestOptions>
    ) => {
        const method = normalizedFilename(
            typeof request === "string" ? "GET" : (request.method ?? "UNKNOWN METHOD")
        );
        const url = normalizedFilename(
            typeof request === "string" ? request : (request.url ?? "UNKNOWN URL")
        );
        const timestamp = normalizedFilename(new Date().toLocaleTimeString());
        const basename = `${method} ${url} ${timestamp}`;
        return enqueueTask("cypress-xray-plugin:task:request", `${basename} request.json`, request)
            .then(originalFn)
            .then((response) =>
                enqueueTask(
                    "cypress-xray-plugin:task:response",
                    `${basename} response.json`,
                    response
                )
            );
    }
);
