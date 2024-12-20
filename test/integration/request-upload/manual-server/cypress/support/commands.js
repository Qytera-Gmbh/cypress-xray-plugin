import { enqueueTask, PluginTask } from "cypress-xray-plugin/commands/tasks";

Cypress.Commands.overwrite("request", (originalFn, options) => {
    return enqueueTask(PluginTask.OUTGOING_REQUEST, "request.json", options)
        .then(originalFn)
        .then((response) => enqueueTask(PluginTask.INCOMING_RESPONSE, "response.json", response));
});
