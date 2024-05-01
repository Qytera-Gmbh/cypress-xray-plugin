import Mocha from "mocha";

/**
 * Exports a custom reporter which combines both Mocha's JSON and list reporters.
 */
module.exports = function multiReporter(runner: Mocha.Runner) {
    const options = {
        // Cast is necessary because reporterOptions does not work (does not create an output file).
        reporterOption: {
            output: ".mocha/results.json",
        },
    } as Mocha.MochaOptions;
    new Mocha.reporters.JSON(runner, options);
    new Mocha.reporters.List(runner);
};
