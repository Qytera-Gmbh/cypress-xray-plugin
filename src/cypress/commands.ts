import { normalizedFilename } from "../util/files";
import { PluginTask, enqueueTask } from "./tasks";

Cypress.Commands.overwrite("request", (originalFn, request) => {
    const method = typeof request === "string" ? "GET" : request.method ?? "UNKNOWN METHOD";
    const url = typeof request === "string" ? request : request.url ?? "UNKNOWN URL";
    const timestamp = normalizedFilename(new Date().toLocaleTimeString());
    const filename = `${method} ${url} ${timestamp}`;
    return enqueueTask(PluginTask.OUTGOING_REQUEST, filename, request)
        .then(originalFn)
        .then((response) => enqueueTask(PluginTask.INCOMING_RESPONSE, filename, response));
});
