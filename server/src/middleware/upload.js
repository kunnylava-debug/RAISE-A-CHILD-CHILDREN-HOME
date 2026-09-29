import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  const allowedDocMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedVideoMimes = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 
    'video/avi', 'video/m4v', 'video/3gpp', 'video/ogg', 'video/x-msvideo'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.3gp'];

  if (
    allowedImageMimes.includes(file.mimetype) ||
    allowedDocMimes.includes(file.mimetype) ||
    allowedVideoMimes.includes(file.mimetype) ||
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type (${file.mimetype}). Supported formats: Images (JPEG, PNG, WEBP), Documents (PDF), and Videos (MP4, WEBM, MOV, MKV).`));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB limit (accommodates high-res video clips & documents)
  }
});
