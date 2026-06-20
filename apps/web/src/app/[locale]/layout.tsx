import { Locale, Providers } from "@/app/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import { LoadingProvider } from "@/context/loading-context";
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
		<TooltipProvider>
			<ThemeProvider>
				<PlanProvider>
					<AuthProvider>
						<LoadingProvider>
							<Providers locale={locale as Locale}>{children}</Providers>
						</LoadingProvider>
					</AuthProvider>
				</PlanProvider>
			</ThemeProvider>
		</TooltipProvider>
	);
}
