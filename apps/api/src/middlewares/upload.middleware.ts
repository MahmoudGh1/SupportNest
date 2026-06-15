import multer from "multer";
import path from "path";

const ALLOWED_MIMETYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
	"text/csv",
	"application/vnd.ms-excel", // some browsers send this for .csv
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".csv"];

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
	const ext = path.extname(file.originalname).toLowerCase();
	const mimetypeOk = ALLOWED_MIMETYPES.includes(file.mimetype);
	const extOk = ALLOWED_EXTENSIONS.includes(ext);

	if (mimetypeOk || extOk) {
		cb(null, true);
	} else {
		cb(new Error("Unsupported file type. Allowed: PDF, DOCX, CSV"));
	}
};

const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter,
	limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
