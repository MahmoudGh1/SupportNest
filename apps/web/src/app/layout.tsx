import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-sora",
});

export const metadata: Metadata = {
	title: "SupportNest",
	description: "AI-powered customer support platform",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
				/>
			</head>
			<body className={`${sora.variable} font-sans antialiased`}>
				{children}
			</body>
		</html>
	);
}
