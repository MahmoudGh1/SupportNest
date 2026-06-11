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

const themeScript = `(function(){try{var t=localStorage.getItem('sn_theme');document.documentElement.classList.toggle('dark',t!=='light');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';document.head.appendChild(l);})();`,
					}}
				/>
			</head>
			<body className={`${sora.variable} font-sans antialiased`}>
				{children}
			</body>
		</html>
	);
}
