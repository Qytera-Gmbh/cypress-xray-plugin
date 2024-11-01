// ============================================================================================== //
// Custom reporters must be CommonJS currently.
// See: https://mochajs.org/#current-limitations
// ============================================================================================== //

/* eslint-disable @typescript-eslint/no-unsafe-argument */

await import("./loader")

const MOCHA = await import("mocha");

/**
 * Exports a custom reporter which combines both Mocha's JSON and list reporters.
 */
module.exports = function multiReporter(runner) {
    const options = {
        // reporterOptions does not work (does not create an output file).
        // We need to use reporterOption instead (without s).
        reporterOption: {
            output: ".mocha/results.json",
        },
    };
    new MOCHA.reporters.JSON(runner, options);
    new MOCHA.reporters.List(runner);
}
