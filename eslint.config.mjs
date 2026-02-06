import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactNativePlugin from "eslint-plugin-react-native";
import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";

const isCI = process.env.CI === "true" || process.env.CI === "1";

export default [
  {
    files: ["eslint.config.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },

  // Ignore generated and vendor dirs
  {
    ignores: [
      "**/node_modules/**",
      "**/.expo/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/web-build/**",
      "**/android/**",
      "**/ios/**",
    ],
  },

  // Base JS recommendations
  js.configs.recommended,

  // TypeScript + React Native + React Hooks
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        // NOTE: If you want type-aware linting later, add:
        // project: './tsconfig.json',
        // tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // RN/Expo globals
        __DEV__: "readonly",
      },
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-native": reactNativePlugin,
      import: importPlugin,
    },
    rules: {
      // Keep lint focused on real issues; Prettier handles formatting
      ...prettierConfig.rules,

      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": isCI ? "error" : "warn",

      // React
      "react/react-in-jsx-scope": "off", // RN + modern React doesn't need it
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Native
      "react-native/no-unused-styles": "warn",
      "react-native/split-platform-components": "warn",
      "react-native/no-inline-styles": "off", // allow; you can enforce later if you want

      // Imports
      "import/order": [
        "warn",
        {
          groups: [
            ["builtin", "external"],
            "internal",
            ["parent", "sibling", "index"],
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "warn",
    },
  },

  // Tests (if/when you add them)
  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/__tests__/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
