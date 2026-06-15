import { upload } from "src/middlewares/upload.middleware.js";
import type { KnowledgeDocumentType } from "generated/prisma/enums.js";
import AppError from "src/utils/appError.js";
import { validateFileMatchesType } from "src/utils/fileType.utils.js";
import prisma from "src/config/prisma.js";
import { uploadToCloudinary } from "src/config/uploadToCloudinary.js";
import { knowledgeQueue } from "src/queues/knowledgeQueue.js";
import type { KnowledgeDocument } from "generated/prisma/client.js";
import { sanitizeForStoragePath } from "src/utils/slug.utils.js";

export async function uploadDocument({
	file,
	type,
	title,
	userId,
	orgId,
}: {
	file: Express.Multer.File;
	type: KnowledgeDocumentType;
	title: string;
	userId: string;
	orgId: string;
}): Promise<{ document: KnowledgeDocument; storagePath: string }> {
	validateFileMatchesType(file, type);

	const apiDocTypes = ["API_DOC", "SWAGGER_URL"];

	if (apiDocTypes.includes(type)) {
		const apiConfig = await prisma.businessApiConfig.findUnique({
			where: { organizationId: orgId },
		});
		if (!apiConfig || !apiConfig.isVerified) {
			throw new AppError(
				"You must configure and verify your API connection before uploading API documentation.",
				400,
			);
		}
	}

	// --- Plan limit check ---
	const org = await prisma.organization.findUnique({
		where: { id: orgId },
		select: { plan: { select: { maxKnowledgeDocuments: true } } },
	});

	const maxDocs = org?.plan?.maxKnowledgeDocuments;

	if (maxDocs !== null && maxDocs !== undefined) {
		const currentCount = await prisma.knowledgeDocument.count({
			where: { organizationId: orgId },
		});

		if (currentCount >= maxDocs) {
			throw new AppError(
				`Your plan allows up to ${maxDocs} knowledge documents. Please upgrade your plan or remove existing documents to upload more.`,
				403,
			);
		}
	}

	// 1. Create the DB row first, no storagePath yet
	const doc = await prisma.knowledgeDocument.create({
		data: {
			organizationId: orgId,
			title,
			type,
			storagePath: null,
			status: "PROCESSING",
			createdById: userId,
		},
	});

	// 2. Upload to Cloudinary
	const safeTitle = sanitizeForStoragePath(title) || "untitled";

	const storagePath = await uploadToCloudinary(
		file.buffer,
		`supportnest/${orgId}/knowledge`,
		`${Date.now()}-${safeTitle}`,
	);

	// 3. Backfill storagePath
	const updatedDoc = await prisma.knowledgeDocument.update({
		where: { id: doc.id },
		data: { storagePath },
	});

	// 4. Queue chunking + embedding job in BullMQ
	try {
		await knowledgeQueue.add("process-document", {
			documentId: updatedDoc.id,
			fileUrl: storagePath,
			orgId,
		}); // await the enqueue itself
	} catch (err) {
		// Enqueue failed — mark the doc as failed so it doesn't sit at PROCESSING forever
		await prisma.knowledgeDocument.update({
			where: { id: updatedDoc.id },
			data: { status: "FAILED" },
		});
		throw new AppError("Failed to queue document for processing.", 500);
	}

	return { document: updatedDoc, storagePath };
}
