"use client";
import { useDebouncedCallback } from "use-debounce";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KnowledgeDocument } from "@/types/types";
import UploadPdfPanel from "@/features/knowledgebase/UploadPdfPanel";
import DeleteModal from "@/features/knowledgebase/DeleteModal";
import DocumentList from "@/features/knowledgebase/DocumentList";
import Loading from "@/features/knowledgebase/Loading";
import ProcessingNotice from "@/features/knowledgebase/ProcessingNotice";
import Header from "@/features/knowledgebase/Header";
import Toast from "@/features/knowledgebase/Toast";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useUrlFilters } from "@/hooks/use-url-filters";
import DocumentFilter from "@/features/knowledgebase/DocumentFilter";

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function KnowledgePage() {
	const { searchParams, updateFilters } = useUrlFilters();

	const [docs, setDocs] = useState<KnowledgeDocument[]>([]);

	const [filterState, setFilterState] = useState({
		title: searchParams.get("title") ?? "",
		type: searchParams.get("type") ?? "",
		createdAt: searchParams.get("createdAt") ?? "",
		createdById: searchParams.get("createdById") ?? "",
		page: Number(searchParams.get("page")) || 1,
		limit: Number(searchParams.get("limit")) || 10,
	});
	const [searchInput, setSearchInput] = useState(filterState.title);
	const debouncedTitleUpdate = useDebouncedCallback((value: string) => {
		setFilterState((prev) => ({ ...prev, title: value, page: 1 }));
		updateFilters("title", value);
		updateFilters("page", null);
	}, 400);

	const [pageLoading, setPageLoading] = useState(true);
	const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocument | null>(
		null,
	);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [toast, setToast] = useState("");

	// ── Fetch ──────────────────────────────────────────────────────────────────
	const fetchDocs = async () => {
		const documents = (await api.getKnowledgeDocs(filterState)).data.documents;
		setDocs(documents);
	};

	useEffect(() => {
		fetchDocs().finally(() => setPageLoading(false));
	}, [
		filterState.title,
		filterState.type,
		filterState.page,
		filterState.limit,
	]);

	// ── Polling: only runs while any doc is "processing" ──────────────────────
	useEffect(() => {
		const hasProcessing = docs.some((d) => d.status === "PROCESSING");
		if (!hasProcessing) return;
		const timer = setInterval(fetchDocs, 3000);
		return () => clearInterval(timer);
	}, [docs]);

	// ── Toast helper ───────────────────────────────────────────────────────────
	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(""), 3000);
	};

	// ── Handlers ───────────────────────────────────────────────────────────────
	const handleUploaded = () => {
		fetchDocs();
		showToast("Document added — processing started.");
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await api.deleteKnowledgeDoc(deleteTarget.id);
			await fetchDocs();
			showToast(`"${deleteTarget.title}" deleted.`);
			setDeleteTarget(null);
		} catch (e: any) {
			showToast("Delete failed: " + e.message);
		} finally {
			setDeleteLoading(false);
		}
	};

	// ── Stats ──────────────────────────────────────────────────────────────────
	const total = docs.length;
	const ready = docs.filter((d) => d.status === "READY").length;
	const processing = docs.filter((d) => d.status === "PROCESSING").length;
	const failed = docs.filter((d) => d.status === "FAILED").length;

	if (pageLoading) {
		return <Loading />;
	}

	return (
		<>
			<style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .kb-row:hover { background: #fafafa !important; }
        .kb-del-btn { opacity: 0 !important; transition: opacity .15s; }
        .kb-row:hover .kb-del-btn { opacity: 1 !important; }
      `}</style>
			<div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
				<KnowledgePage.Header stats={{ total, ready, processing, failed }} />
				<div className="mt-6">
					<UploadPdfPanel onUploaded={handleUploaded} />
				</div>{" "}
				<div className="mt-6">
					{processing > 0 && <ProcessingNotice processing={processing} />}
				</div>
				<div className="mt-6">
					<DocumentFilter
						title={searchInput}
						type={filterState.type}
						onSearchChange={(value) => {
							setSearchInput(value);
							debouncedTitleUpdate(value);
						}}
						onFilterChange={(value) => {
							setFilterState((prev) => ({ ...prev, type: value, page: 1 }));
							updateFilters("type", value);
							updateFilters("page", null);
						}}
					/>
					<DocumentList
						docs={docs}
						handleDelete={handleDelete}
						setDeleteTarget={setDeleteTarget}
					/>
				</div>
			</div>
			{/* Delete confirm modal */}
			{deleteTarget && (
				<DeleteModal
					doc={deleteTarget}
					onConfirm={handleDelete}
					onCancel={() => setDeleteTarget(null)}
					loading={deleteLoading}
				/>
			)}
			<Toast message={toast} />
		</>
	);
}

KnowledgePage.Header = Header;
