const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-BI${fileExtension}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedFormats = ['.png', '.jpg', '.jpeg', '.gif', '.xlsx', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedFormats.includes(fileExtension)) {
        cb(null, true);
    } else {
        req.flash('error', 'فرمت فایل مجاز نیست.');
        cb(new Error('فرمت فایل مجاز نیست.'), false); 
    }
};


const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter,
});

module.exports = upload;
