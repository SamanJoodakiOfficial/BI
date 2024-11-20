const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-BI${fileExtension}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedFormats = ['.png', '.jpg', '.jpeg', '.gif'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedFormats.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('فقط فایل‌های تصویری با فرمت‌های PNG، JPG، JPEG و GIF مجاز هستند!'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter,
});

module.exports = upload;
