import { S } from "@/components/ui";
import StatusBadge from "@/features/knowledgebase/StatusBadge";
import TypeBadge from "@/features/knowledgebase/TypeBadge";
import { api } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils/utils";
import { KnowledgeDocument } from "@/types/types";
import React, { Dispatch, SetStateAction } from "react";

const DocumentList = ({
	docs,
	handleDelete,
	setDeleteTarget,
}: {
	docs: KnowledgeDocument[];
	handleDelete: () => void;
	setDeleteTarget: Dispatch<SetStateAction<KnowledgeDocument | null>>;
}) => {
	return (
		<div>
			{docs.length === 0 ? (
				<div
					style={{
						textAlign: "center",
						padding: "3rem",
						color: S.textMuted,
					}}
				>
					<i
						className="ti ti-book-off"
						style={{ fontSize: 36, marginBottom: 12, display: "block" }}
					/>
					<div
						style={{
							fontSize: 14,
							fontWeight: 500,
							color: S.dark,
							marginBottom: 4,
						}}
					>
						No documents yet
					</div>
					<div style={{ fontSize: 13 }}>
						Upload a PDF or add a FAQ URL above to get started.
					</div>
				</div>
			) : (
				<>
					<div
						className="hidden md:block"
						style={{
							background: "#fff",
							borderRadius: 12,
							border: `0.5px solid ${S.border}`,
							overflow: "hidden",
						}}
					>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
								fontSize: 13,
							}}
						>
							<thead>
								<tr style={{ borderBottom: `0.5px solid ${S.border}` }}>
									{[
										"Document",
										"Type",
										"Status",
										"Size / Info",
										"Added",
										"",
									].map((h) => (
										<th
											key={h}
											style={{
												textAlign: "left",
												padding: "10px 16px",
												fontSize: 10,
												fontWeight: 600,
												color: S.textMuted,
												letterSpacing: ".06em",
												textTransform: "uppercase",
											}}
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{docs.map((doc, i) => (
									<tr
										key={doc.id}
										className="kb-row"
										style={{
											borderBottom:
												i < docs.length - 1
													? `0.5px solid ${S.border}`
													: "none",
											background: "#fff",
											transition: "background .1s",
											animation: "fadeIn .2s ease",
										}}
									>
										{/* Title */}
										<td style={{ padding: "12px 16px", maxWidth: 260 }}>
											<div
												style={{
													fontWeight: 500,
													color: S.dark,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{doc.title}
											</div>
											<div
												style={{
													fontSize: 11,
													color: S.textMuted,
													marginTop: 2,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{doc.storagePath}
											</div>
										</td>
										{/* Type */}
										<td style={{ padding: "12px 16px" }}>
											<TypeBadge type={doc.type} />
										</td>
										{/* Status */}
										<td style={{ padding: "12px 16px" }}>
											<StatusBadge status={doc.status} />
										</td>
										{/* Meta */}
										<td
											style={{
												padding: "12px 16px",
												color: S.textMuted,
												fontSize: 12,
											}}
										>
											{doc.type === "PDF" ? (
												<div>
													<div>{formatBytes(doc.metadata.fileSize)}</div>
													{doc.metadata.pageCount ? (
														<div>{doc.metadata.pageCount} pages</div>
													) : null}
												</div>
											) : (
												<div>{doc.metadata.faqCategory || "—"}</div>
											)}
										</td>
										{/* Date */}
										<td
											style={{
												padding: "12px 16px",
												color: S.textMuted,
												fontSize: 12,
												whiteSpace: "nowrap",
											}}
										>
											{formatDate(doc.createdAt)}
										</td>
										{/* Delete */}
										<td style={{ padding: "12px 16px", textAlign: "right" }}>
											<button
												className=""
												onClick={() => setDeleteTarget(doc)}
												style={{
													width: 30,
													height: 30,
													border: `0.5px solid ${S.border}`,
													borderRadius: 7,
													background: "#fff",
													cursor: "pointer",
													display: "inline-flex",
													alignItems: "center",
													justifyContent: "center",
													color: S.danger,
												}}
											>
												<i
													className="ti ti-trash"
													style={{ fontSize: 15 }}
												/>
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div>
						<div className="flex flex-col  gap-4 md:hidden">
							{docs.map((doc) => (
								<div
									key={doc.id}
									style={{
										border: `0.5px solid ${S.border}`,
										borderRadius: 10,
										padding: "14px 16px",
										background: "#fff",
										display: "flex",
										flexDirection: "column",
										gap: 8,
									}}
								>
									{/* Row 1: Title + Delete button */}
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
										}}
									>
										<div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
											<div
												style={{
													fontWeight: 500,
													color: S.dark,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{doc.title}
											</div>
											<div
												style={{
													fontSize: 11,
													color: S.textMuted,
													marginTop: 2,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{doc.storagePath}
											</div>
										</div>
										<button
											className=""
											onClick={() => setDeleteTarget(doc)}
											style={{
												width: 30,
												height: 30,
												border: `0.5px solid ${S.border}`,
												borderRadius: 7,
												background: "#fff",
												cursor: "pointer",
												flexShrink: 0,
												display: "inline-flex",
												alignItems: "center",
												justifyContent: "center",
												color: S.danger,
											}}
										>
											<i
												className="ti ti-trash"
												style={{ fontSize: 15 }}
											/>
										</button>
									</div>

									{/* Row 2: Badges + meta */}
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 8,
											flexWrap: "wrap",
										}}
									>
										<TypeBadge type={doc.type} />
										<StatusBadge status={doc.status} />
										<span style={{ fontSize: 11, color: S.textMuted }}>
											{doc.type === "PDF"
												? `${formatBytes(doc.metadata.fileSize)}${doc.metadata.pageCount ? ` · ${doc.metadata.pageCount} pages` : ""}`
												: doc.metadata.faqCategory || "—"}
										</span>
									</div>

									{/* Row 3: Date */}
									<div style={{ fontSize: 11, color: S.textMuted }}>
										Added {formatDate(doc.createdAt)}
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default DocumentList;
