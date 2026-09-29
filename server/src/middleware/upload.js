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

const DANGEROUS_EXTENSIONS = new Set([
  '.php', '.phtml', '.php3', '.php4', '.php5', '.php7', '.phps', 
  '.cgi', '.pl', '.asp', '.aspx', '.jsp', '.sh', '.bash', 
  '.exe', '.bat', '.cmd', '.com', '.vbs', '.ps1', '.py', '.rb', 
  '.jar', '.war', '.html', '.htm', '.shtml', '.xhtml', '.js', '.mjs', '.cjs'
]);

const fileFilter = (req, file, cb) => {
  const allowedExtensions = new Set([
    '.jpg', '.jpeg', '.png', '.webp', '.gif', 
    '.pdf', 
    '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.3gp'
  ]);

  const ext = path.extname(file.originalname || '').toLowerCase();

  // 1. Block null-byte or path traversal in original name
  if (!file.originalname || file.originalname.includes('\0') || file.originalname.includes('..')) {
    return cb(new Error('Security Exception: Invalid or malicious filename detected.'));
  }

  // 2. Reject all dangerous and executable extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error('Security Exception: Executable or script files are strictly blocked.'));
  }

  // 3. Extension MUST be in the safe whitelist
  if (!allowedExtensions.has(ext)) {
    return cb(new Error(`Invalid file extension (${ext}). Allowed: Images (.jpg, .png, .webp, .gif), Documents (.pdf), Videos (.mp4, .webm, .mov, .mkv).`));
  }

  // 4. MIME type must be an acceptable media/document type
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';
  const isPdf = file.mimetype === 'application/pdf';

  if (!isImage && !isVideo && !isPdf) {
    return cb(new Error(`Invalid MIME type (${file.mimetype}). File content must match allowed image, video, or PDF formats.`));
  }

  cb(null, true);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB limit (accommodates high-res video clips & documents)
  }
});
