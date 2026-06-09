import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: true,
	experimental: {
		swcPlugins: [
			[
				"@lingui/swc-plugin",
				{
					runtimeModules: {
						i18n: ["@lingui/core", "i18n"],
						trans: ["@lingui/react", "Trans"],
					},
				},
			],
		],
	},
};

export default nextConfig;
