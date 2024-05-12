import { normalizedFilename } from "../util/files";
import { PluginTask, enqueueTask } from "./tasks";

Cypress.Commands.overwrite(
    "request",
    (
        originalFn: Cypress.CommandOriginalFn<"request">,
        request: Partial<Cypress.RequestOptions>
    ) => {
        const method = normalizedFilename(
            typeof request === "string" ? "GET" : request.method ?? "UNKNOWN METHOD"
        );
        const url = normalizedFilename(
            typeof request === "string" ? request : request.url ?? "UNKNOWN URL"
        );
        const timestamp = normalizedFilename(new Date().toLocaleTimeString());
        const basename = `${method} ${url} ${timestamp}`;
        return enqueueTask(PluginTask.OUTGOING_REQUEST, `${basename} request.json`, request)
            .then(originalFn)
            .then((response) =>
                enqueueTask(PluginTask.INCOMING_RESPONSE, `${basename} response.json`, response)
            );
    }
);
