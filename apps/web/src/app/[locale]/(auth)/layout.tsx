import { GuestAuthRoute } from "@/components/guest-only-route";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <GuestAuthRoute>{children}</GuestAuthRoute>;
}
