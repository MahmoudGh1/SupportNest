"use client";

import { useDebouncedCallback } from "use-debounce";
import ApiToolsPanel from "@/features/knowledgebase/ApiToolsPanel";
import { useCallback, useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { KnowledgeDocument } from "@/types/types";
import UploadPdfPanel from "@/features/knowledgebase/UploadPdfPanel";
import DeleteModal from "@/features/knowledgebase/DeleteModal";
import DocumentList from "@/features/knowledgebase/DocumentList";
import Loading from "@/features/knowledgebase/Loading";
import ProcessingNotice from "@/features/knowledgebase/ProcessingNotice";
import Header from "@/features/knowledgebase/Header";
import Toast from "@/features/knowledgebase/Toast";
import { useUrlFilters } from "@/hooks/use-url-filters";
import DocumentFilter from "@/features/knowledgebase/DocumentFilter";

export default function KnowledgePage() {
	const { searchParams, updateFilters } = useUrlFilters();

	const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
	const [pageLoading, setPageLoading] = useState(true);
	const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocument | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [toast, setToast] = useState("");

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

	// ── Stats ──────────────────────────────────────────────────────────────────
	const stats = useMemo(() => {
		const total = docs.length;
		const ready = docs.filter((d) => d.status === "READY").length;
		const processing = docs.filter((d) => d.status === "PROCESSING").length;
		const failed = docs.filter((d) => d.status === "FAILED").length;
		return { total, ready, processing, failed };
	}, [docs]);

	// ── Fetch ──────────────────────────────────────────────────────────────────
	const fetchDocs = useCallback(async () => {
		const data = await api.getKnowledgeDocs(filterState);
		const documents = data ? data.data.documents : [];
		setDocs(documents);
	}, [filterState]);

	useEffect(() => {
		fetchDocs().finally(() => setPageLoading(false));
	}, [filterState.title, filterState.type, filterState.page, filterState.limit, fetchDocs]);

	// ── Polling ────────────────────────────────────────────────────────────────
	useEffect(() => {
		const hasProcessing = docs.some((d) => d.status === "PROCESSING");
		if (!hasProcessing) return;

		const timer = setInterval(() => {
			fetchDocs();
		}, 3000);

		return () => clearInterval(timer);
	}, [docs, fetchDocs]);

	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(""), 3000);
	};

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

	if (pageLoading) {
		return <Loading />;
	}

	return (
		<>
			<style>{`
				@keyframes spin { to { transform: rotate(360deg) } }
				@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
				
				.kb-row:hover { background-color: var(--row-hover-bg, #fafafa) !important; }
				.kb-del-btn { opacity: 0 !important; transition: opacity .15s; }
				.kb-row:hover .kb-del-btn { opacity: 1 !important; }

				/* Target Dark Mode Classes injected safely by theme-context */
				html.dark .kb-row:hover {
					--row-hover-bg: #1f1f23 !important;
				}

				/* Safely scope dark-mode overrides to NOT leak into Light Mode */
				html.dark .kb-panel-container > div,
				html.dark .kb-custom-card {
					background-color: #14142b !important; 
					color: #f4f4f6 !important;
					border-color: #222240 !important;
				}

				html.dark input, 
				html.dark textarea {
					background-color: #0b0b1a !important;
					color: #ffffff !important;
					border: 1px solid #2d2d4d !important;
				}
				html.dark input::placeholder {
					color: #71717a !important;
				}
			`}</style>

			<div className="mx-auto max-w-[1200px] p-4 sm:p-6 text-zinc-900 dark:text-zinc-100 bg-transparent transition-colors duration-200">
				<KnowledgePage.Header stats={stats} />

				{/* Panels Grid Setup */}
				<div className="kb-panel-container grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
					<UploadPdfPanel onUploaded={handleUploaded} />
					<ApiToolsPanel onToolsExtracted={handleUploaded} />
				</div>

				<div className="mt-6">
					{stats.processing > 0 && <ProcessingNotice processing={stats.processing} />}
				</div>

				{/* Table Wrapper Component Card — Cleared Gray Overlay Bug */}
				<div className="kb-custom-card mt-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm">
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
					<div className="mt-4 overflow-x-auto">
						<DocumentList
							docs={docs}
							handleDelete={handleDelete}
							setDeleteTarget={setDeleteTarget}
						/>
					</div>
				</div>
			</div>

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
