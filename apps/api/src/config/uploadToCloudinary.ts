import cloudinary from "./cloudinary.js";
import { Readable } from "stream";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export const uploadToCloudinary = (
	fileBuffer: Buffer,
	folder: string,
	filename: string,
): Promise<string> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				public_id: filename,
				resource_type: "raw", // for PDFs and non-image files
			},
			(
				error: UploadApiErrorResponse | undefined,
				result: UploadApiResponse | undefined,
			) => {
				if (error || !result) return reject(error);
				resolve(result.secure_url);
			},
		);

		Readable.from(fileBuffer).pipe(uploadStream);
	});
};

// export const uploadToCloudinary = (
// 	fileBuffer: Buffer,
// 	folder: string,
// 	filename: string,
// ): Promise<string> => {
// 	return new Promise((resolve, reject) => {
// 		// 1. Get the extension from the file name (e.g. '.csv', '.pdf', '.docx')
// 		const extensionIndex = filename.lastIndexOf(".");
// 		const ext = extensionIndex !== -1 ? filename.slice(extensionIndex) : "";
// 		console.log(ext);
// 		// 2. Ensure the public_id keeps its original extension suffix
// 		const cleanFilename =
// 			filename.endsWith(ext) || ext === "" ? filename : `${filename}${ext}`;
// 		console.log(cleanFilename);
// 		const uploadStream = cloudinary.uploader.upload_stream(
// 			{
// 				folder,
// 				public_id: cleanFilename, // Keeps extensions intact for all file types
// 				resource_type: "raw",
// 			},
// 			(
// 				error: UploadApiErrorResponse | undefined,
// 				result: UploadApiResponse | undefined,
// 			) => {
// 				if (error || !result) return reject(error);
// 				resolve(result.secure_url);
// 			},
// 		);

// 		Readable.from(fileBuffer).pipe(uploadStream);
// 	});
// };
