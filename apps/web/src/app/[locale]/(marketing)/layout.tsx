import Navbar from "@/components/Navbar";

export default function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="font-sans bg-[#0F0F0F] dark:bg-[#0F0F0F] min-h-screen text-white">
			<Navbar />
			{children}
		</div>
	);
}
