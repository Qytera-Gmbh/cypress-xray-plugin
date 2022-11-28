const { beforeRunHook, afterRunHook } = require("./src/hooks");

module.exports = function (on) {
    on("before:run", async (details) => {
        await beforeRunHook(details);
    });

    on("after:run", async (results) => {
        await afterRunHook(results);
    });

    on("after:screenshot", async (details) => {
        console.log("after:screenshot", details);
    });
};
