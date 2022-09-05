module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', "prettier", "plugin:react/recommended"],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    overrides: [
        {
            files: ['*.ts', '*.mts', '*.cts', '*.tsx'],
            rules: {
                'no-undef': 'off',
                "react/jsx-key": "warn",
                "react/prop-types": "warn",
                "prefer-const": "warn",
                "no-empty": "warn"
            },
        }
    ]
};
