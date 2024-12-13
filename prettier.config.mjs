/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
export default {
    arrowParens: "always",
    endOfLine: "auto",
    overrides: [
        {
            files: "*.yml",
            options: {
                tabWidth: 2,
            },
        },
    ],
    printWidth: 100,
    semi: true,
    tabWidth: 4,
    trailingComma: "es5",
    useTabs: false,
};
