import { defineConfig } from "@lingui/cli";

export default defineConfig({
	sourceLocale: "en",
	locales: ["en", "ar"],
	fallbackLocales: {
		default: "en",
	},
	catalogs: [
		{
			path: "src/locales/{locale}/messages",
			include: ["src/app/**", "src/components/**", "src/features/**"],
		},
	],
	compileNamespace: "es",
});
