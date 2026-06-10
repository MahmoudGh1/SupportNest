import { Locale, Providers } from "@/app/providers";
import { AuthProvider } from "@/context/auth-context";

import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "../globals.css";
import { getI18nInstance } from "@/lib/lingui";
import { setI18n } from "@lingui/react/server";
import { PlanProvider } from "@/context/plan-context";

const sora = Sora({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-sora",
});

export const metadata: Metadata = {
	title: "SupportNest",
	description: "AI-powered customer support platform",
};

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	return (
		<html
			lang={locale}
			dir={locale === "ar" ? "rtl" : "ltr"}
		>
			<head>
				{/* Tabler Icons */}
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
				/>
			</head>
			<body className={`${sora.variable} font-sans antialiased`}>
				<PlanProvider>
					<AuthProvider>
						<Providers locale={locale as Locale}>{children}</Providers>
					</AuthProvider>
				</PlanProvider>
			</body>
		</html>
	);
}
