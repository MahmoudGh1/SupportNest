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
		return [
			{
				source: "/api/v1/:path*",
				destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
			},
		];
	},
};

export default nextConfig;
