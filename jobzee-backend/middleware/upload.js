const multer = require("multer");
const path = require("path");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Single file upload middleware
const uploadSingle = upload.single("photo");

// Multiple files upload middleware
const uploadMultiple = upload.array("photos", 5); // Max 5 files

// Document upload middleware (for PDFs and images)
const documentStorage = multer.memoryStorage();

const documentFilter = (req, file, cb) => {
  // Allow images and PDFs
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype =
    file.mimetype === "application/pdf" || file.mimetype.startsWith("image/");

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files (JPEG, JPG, PNG, GIF, WEBP) and PDF documents are allowed!",
      ),
      false,
    );
  }
};

const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: documentFilter,
});

const uploadDocument = documentUpload.single("file");

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadDocument,
};
