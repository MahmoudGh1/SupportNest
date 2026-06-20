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
	async rewrites() {
		const apiTarget =
			process.env.API_PROXY_TARGET?.replace(/\/+$/, "") ??
			"http://localhost:3001/api/v1";
		return [
			{
				source: "/api/v1/:path*",
				destination: `${apiTarget}/:path*`,
			},
		];
	},
};

export default nextConfig;
