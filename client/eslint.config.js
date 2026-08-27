import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // A leading underscore marks a binding that is deliberately unused —
      // the convention the server already follows with `_req` and `_next`.
      // The rule stays an error: only the frozen baseline below is relaxed.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Existing debt, frozen rather than hidden.
      //
      // Turning these on as errors would have made CI red on the day it was
      // introduced, and a gate that is red on arrival gets switched off within
      // a week. As warnings they still show up in every run, while the
      // `--max-warnings` cap in package.json pins the count to what the code
      // had on the day the pipeline landed: the debt can shrink, never grow.
      //
      // Lower the cap whenever a batch is cleared. It should reach 0.
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
])
