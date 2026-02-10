import js from "@eslint/js";
import path from "node:path";
import globals from "globals";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import svelteConfig from "./svelte.config.js";
import { includeIgnoreFile } from "@eslint/compat";

export default defineConfig(
	includeIgnoreFile(path.resolve(import.meta.dirname, ".gitignore")),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: { "no-undef": "off" }
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: [".svelte"],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
