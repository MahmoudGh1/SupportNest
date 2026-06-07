import cloudinary from "./cloudinary.js";
import { Readable } from "stream";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export const uploadToCloudinary = (fileBuffer: Buffer, folder: string, filename: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				public_id: filename,
				resource_type: "raw", // for PDFs and non-image files
			},
			(error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
				if (error || !result) return reject(error);
				resolve(result.secure_url);
			},
		);

		Readable.from(fileBuffer).pipe(uploadStream);
	});
};
