import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/**', 'dev-dist/**', 'node_modules/**', 'test-results/**', '.worktrees/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression > TSAnyKeyword',
          message: 'Use a concrete type or narrow unknown instead of asserting as any.',
        },
        {
          selector: 'TSTypeAssertion > TSAnyKeyword',
          message: 'Use a concrete type or narrow unknown instead of asserting any.',
        },
      ],
    },
  },
  {
    files: ['src/games/**/*.ts'],
    ignores: ['src/games/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression > TSAnyKeyword',
          message: 'Use a concrete type or narrow unknown instead of asserting as any.',
        },
        {
          selector: 'TSTypeAssertion > TSAnyKeyword',
          message: 'Use a concrete type or narrow unknown instead of asserting any.',
        },
        {
          selector: 'CallExpression[callee.type="MemberExpression"][callee.property.name="addEventListener"]',
          message: 'Use ctx.listen so the round owns listener cleanup.',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.computed=true][callee.property.value="addEventListener"]',
          message: 'Use ctx.listen so the round owns listener cleanup.',
        },
      ],
    },
  },
];
