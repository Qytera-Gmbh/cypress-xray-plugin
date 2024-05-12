import { normalizedFilename } from "../util/files";
import { PluginTask, enqueueTask } from "./tasks";

Cypress.Commands.overwrite("request", (originalFn, request) => {
    const method = typeof request === "string" ? "GET" : request.method ?? "UNKNOWN METHOD";
    const url = typeof request === "string" ? request : request.url ?? "UNKNOWN URL";
    const timestamp = new Date().toLocaleTimeString();
    const basename = normalizedFilename(`${method} ${url} ${timestamp}`);
    return enqueueTask(PluginTask.OUTGOING_REQUEST, `${basename} request.json`, request)
        .then(originalFn)
        .then((response) =>
            enqueueTask(PluginTask.INCOMING_RESPONSE, `${basename} response.json`, response)
        );
});
