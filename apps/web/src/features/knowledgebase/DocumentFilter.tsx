import { useState } from "react";
import { KnowledgeDocumentType } from "../../../../api/generated/prisma/enums";

type FilterOption = KnowledgeDocumentType | "all";

interface DocumentFilterProps {
	title: string;
	type: string;
	onSearchChange: (value: string) => void;
	onFilterChange: (value: string) => void;
}

export default function DocumentFilter({
	title,
	type,
	onSearchChange,
	onFilterChange,
}: DocumentFilterProps) {
	const filters: FilterOption[] = ["all", "PDF", "DOCX", "CSV"];
	return (
		<div className="mb-4 flex flex-col gap-3">
			<input
				type="text"
				value={title}
				onChange={(e) => onSearchChange(e.target.value)}
				placeholder="Search documents..."
				className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
			/>
			<div className="flex gap-2">
				{filters.map((f) => (
					<button
						key={f}
						onClick={() => onFilterChange(f === "all" ? "" : f)}
						className={`rounded px-3 py-1 text-sm capitalize ${
							(f === "all" ? "" : f) === type
								? "bg-blue-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						{f}
					</button>
				))}
			</div>
		</div>
	);
}
