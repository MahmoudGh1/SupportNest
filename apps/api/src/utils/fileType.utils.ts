// src/utils/fileType.utils.ts
import path from "path";
import AppError from "src/utils/appError.js";

const FILE_TYPE_RULES: Record<
	string,
	{ mimetypes: string[]; extensions: string[] }
> = {
	PDF: { mimetypes: ["application/pdf"], extensions: [".pdf"] },
	DOCX: {
		mimetypes: [
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		],
		extensions: [".docx"],
	},
	CSV: {
		mimetypes: ["text/csv", "application/vnd.ms-excel"],
		extensions: [".csv"],
	},
};

export function validateFileMatchesType(
	file: Express.Multer.File,
	type: string,
) {
	const rule = FILE_TYPE_RULES[type];

	// Not a file-format type (FAQ, API_DOC, SWAGGER_URL, etc.) — nothing to check
	if (!rule) return;

	const ext = path.extname(file.originalname).toLowerCase();
	const mimetypeOk = rule.mimetypes.includes(file.mimetype);
	const extOk = rule.extensions.includes(ext);

	if (!mimetypeOk && !extOk) {
		throw new AppError(
			`Uploaded file does not match declared type "${type}"`,
			400,
		);
	}
}
