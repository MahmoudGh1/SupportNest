"use client";

import { useParams, useRouter } from "next/navigation";
import { OrganizationDetail } from "@/components/admin-dashboard/OrganizationDetail";

export default function OrganizationDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	if (!id) return null;

	return (
		<div style={{ padding: "1.5rem" }}>
			<OrganizationDetail
				orgId={id}
				onClose={() => router.push("/dashboard/organizations")}
			/>
		</div>
	);
}
