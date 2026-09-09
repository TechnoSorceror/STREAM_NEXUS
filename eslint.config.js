import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['dist/**', '.vercel/**', 'node_modules/**', 'artifacts/**', 'migrated_prompt_history/**', 'all_source_code.txt', '*.py'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed in React 18+
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['worker/**/*.js'],
    languageOptions: {
      globals: { URL: 'readonly', URLSearchParams: 'readonly', Request: 'readonly', Response: 'readonly', fetch: 'readonly' },
    },
  },
  {
    files: ['api/**/*.js'],
    languageOptions: {
      globals: { URL: 'readonly', Request: 'readonly', Response: 'readonly', Headers: 'readonly', fetch: 'readonly', process: 'readonly', console: 'readonly' },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { URL: 'readonly', Request: 'readonly', Response: 'readonly', console: 'readonly' },
    },
  },
  {
    files: ['server.mjs'],
    languageOptions: {
      globals: { URL: 'readonly', Request: 'readonly', Response: 'readonly', Headers: 'readonly', console: 'readonly', process: 'readonly' },
    },
  }
);
