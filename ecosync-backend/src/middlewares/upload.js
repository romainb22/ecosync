const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "text/csv") {
        cb(null, true);
    } else {
        cb(new Error("Seuls les fichiers CSV sont acceptés"), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
