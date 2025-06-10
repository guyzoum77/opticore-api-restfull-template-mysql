const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const path = require("path");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");

const eslintRecommended = js.configs.recommended;

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: eslintRecommended,
    allConfig: eslintRecommended
});



module.exports = [
    ...compat.config({
        env: {
            node: true,
            es2022: true,
        },
        parser: '@typescript-eslint/parser',
        parserOptions: {
            project: './tsconfig.json',
            tsconfigRootDir: __dirname,
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
            "import": require("eslint-plugin-import")
        },
        extends: [
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:import/recommended',
            'plugin:import/typescript',
        ],
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                },
            },
            node: true,
        },
        rules: {
            // === Clean Architecture Dependency Rules ===
            'import/no-restricted-paths': [
                'error',
                {
                    zones: [
                        // Domain should not depend on Infrastructure
                        {
                            target: './src/domain',
                            from: './src/infrastructure',
                            message: "Domain layer must not depend on Infrastructure. Use interfaces from Core instead.",
                        },
                        // Core should not depend on Presentation
                        {
                            target: './src/core',
                            from: './src/presentation',
                            message: "Core layer must not depend on Presentation. Core should remain framework-agnostic.",
                        },
                        // Application should not depend on Infrastructure
                        {
                            target: './src/application',
                            from: './src/infrastructure',
                            message: "Application layer must depend on abstractions (Core), not implementations (Infrastructure).",
                        },
                        // Domain should not depend on Presentation
                        {
                            target: './src/domain',
                            from: './src/presentation',
                            message: "Domain must remain pure business logic. Presentation should call Application, not Domain directly.",
                        },
                    ],
                },
            ],

            // === Recommended additional rules ===
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': 'error',
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'import/no-cycle': ['error', { maxDepth: Infinity }],
            'import/no-useless-path-segments': ['error', { noUselessIndex: true }],
        },
        overrides: [
            {
                files: ['**/*.spec.ts', '**/*.test.ts'],
                env: {
                    jest: true,
                },
                rules: {
                    '@typescript-eslint/no-non-null-assertion': 'off',
                },
            },
        ],
    })
];