// @ts-check

import eslint from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import tsdoc from "eslint-plugin-tsdoc";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: { perfectionist, tsdoc },
    },
    {
        rules: {
            "@typescript-eslint/consistent-type-exports": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/member-ordering": "error",
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    format: ["strictCamelCase"],
                    selector: "default",
                },
                {
                    format: ["UPPER_CASE"],
                    modifiers: ["global", "const"],
                    selector: "variable",
                },
                {
                    format: ["UPPER_CASE"],
                    modifiers: ["static", "readonly"],
                    selector: "memberLike",
                },
                {
                    format: ["UPPER_CASE"],
                    selector: "enumMember",
                },
                {
                    format: ["StrictPascalCase"],
                    selector: "typeLike",
                },
                {
                    format: ["StrictPascalCase", "strictCamelCase"],
                    selector: "import",
                },
            ],
            "@typescript-eslint/no-deprecated": "off",
            "@typescript-eslint/no-shadow": "error",
            "@typescript-eslint/non-nullable-type-assertion-style": "off",
            "@typescript-eslint/parameter-properties": "error",
            "@typescript-eslint/prefer-readonly": "error",
            "no-shadow": "off",
            "perfectionist/sort-array-includes": ["error", { order: "asc", type: "alphabetical" }],
            "perfectionist/sort-enums": ["error", { order: "asc", type: "alphabetical" }],
            "perfectionist/sort-exports": ["error", { order: "asc", type: "alphabetical" }],
            "perfectionist/sort-interfaces": ["error", { order: "asc", type: "alphabetical" }],
            "perfectionist/sort-named-exports": ["error", { order: "asc", type: "alphabetical" }],
            "perfectionist/sort-object-types": ["error", { order: "asc", type: "alphabetical" }],
            "perfectionist/sort-objects": ["error", { order: "asc", type: "alphabetical" }],
            "perfectionist/sort-union-types": ["error", { order: "asc", type: "alphabetical" }],
            "tsdoc/syntax": "error",
        },
    },
    { files: ["**/*.mjs"], ...tseslint.configs.disableTypeChecked }
);
