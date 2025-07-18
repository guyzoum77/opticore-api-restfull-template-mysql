const js = require("@eslint/js");
const globals = require("globals");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const importPlugin = require("eslint-plugin-import");


module.exports = [
    {
        files: ["**/*.ts", "**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            parser: tsParser,
            parserOptions: {
                sourceType: "module",
                ecmaVersion: "latest",
            },
            globals: globals.node,
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            import: importPlugin
        },
        rules: {
            "import/no-restricted-paths": [
                "error",
                {
                    zones: [
                        {
                            target: "./src/domain",
                            from: "./src/infrastructure",
                            message:
                                "Domain layer must not depend on Infrastructure. Use interfaces from Core instead.",
                        },
                        {
                            target: "./src/core",
                            from: "./src/presentation",
                            message:
                                "Core layer must not depend on Presentation. Core should remain framework-agnostic.",
                        },
                        {
                            target: "./src/application",
                            from: "./src/infrastructure",
                            message:
                                "Application layer must depend on abstractions (Core), not implementations (Infrastructure).",
                        },
                        {
                            target: "./src/domain",
                            from: "./src/presentation",
                            message:
                                "Domain must remain pure business logic. Presentation should call Application, not Domain directly.",
                        },
                    ],
                },
            ],
            "@typescript-eslint/no-unused-vars": ["warn"],
            "@typescript-eslint/explicit-function-return-type": "off",
        },
    },
    js.configs.recommended,
];