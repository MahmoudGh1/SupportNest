import { Locale, Providers } from "@/app/providers";
import { AuthProvider } from "@/context/auth-context";
import { PlanProvider } from "@/context/plan-context";
import { ThemeProvider } from "@/context/theme-context";

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	return (
		<ThemeProvider>
			<PlanProvider>
				<AuthProvider>
					<Providers locale={locale as Locale}>{children}</Providers>
				</AuthProvider>
			</PlanProvider>
		</ThemeProvider>
	);
}
