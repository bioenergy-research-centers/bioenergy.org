module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:prettier/recommended',
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        // Add your custom rules here
    },
};