import Navbar from "@/components/Navbar";

export default function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="font-sans bg-white min-h-screen">
			<Navbar />
			{children}
		</div>
	);
}
