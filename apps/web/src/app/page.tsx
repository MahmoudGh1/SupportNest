import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/routes";

export default function RootPage() {
	redirect(`/${defaultLocale}`);
}
