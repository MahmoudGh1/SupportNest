import type { GetKnowledgeDocsResponse, KnowledgeDocument } from "@/types/types";
import { BASE_URL, getErrorMessage } from "./client";
import { getSession } from "@/lib/auth";

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────

export async function getKnowledgeDocs(filterState: Record<string, string | number | undefined | null>): Promise<GetKnowledgeDocsResponse | null> {
	const user = getSession();
	if (!user) throw new Error("User not found");

	const params = new URLSearchParams();
	Object.entries(filterState).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			params.append(key, String(value));
		}
	});

	try {
		const response = await fetch(`${BASE_URL}/organizations/${user.organizationId}/knowledge?${params.toString()}`, { credentials: "include" });
		if (!response.ok) throw new Error(response.statusText);
		return response.json();
	} catch (error: unknown) {
		console.error(getErrorMessage(error));
		return null;
	}
}

export async function uploadPdf(input: { file: File; title: string }): Promise<{ document: KnowledgeDocument }> {
	const user = getSession();
	if (!user) throw new Error("User not found");

	const formData = new FormData();
	formData.append("file", input.file);
	formData.append("title", input.title);
	formData.append("type", "PDF");

	const response = await fetch(`${BASE_URL}/organizations/${user.organizationId}/knowledge`, {
		method: "POST",
		body: formData,
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.message ?? `Upload failed: ${response.status}`);
	}

	return response.json();
}

export async function deleteKnowledgeDoc(id: string): Promise<{ success: boolean }> {
	const user = getSession();
	if (!user) throw new Error("User not found");

	try {
		const response = await fetch(`${BASE_URL}/organizations/${user.organizationId}/knowledge/${id}`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.message ?? "Something went wrong");
		return { success: data.success };
	} catch (error: unknown) {
		console.error(getErrorMessage(error));
		return { success: false };
	}
}

export async function submitSwaggerUrl(input: { title: string; swaggerUrl: string }): Promise<{ documentId: string; status: string }> {
	const user = getSession();
	if (!user) throw new Error("User not found");

	const res = await fetch(`${BASE_URL}/organizations/${user.organizationId}/documents/swagger`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(input),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message ?? data.error ?? "Failed to submit Swagger URL");
	return data;
}
