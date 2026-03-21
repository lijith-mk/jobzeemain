const express = require('express');
const multer = require('multer');
const path = require('path');

const auth = require('../middleware/auth');
const {
  analyzeResumeAndStoreATS,
  getMyResumeATSAnalyses,
  getResumeATSAnalysisById,
} = require('../controllers/resumeATSAnalysisController');

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|doc|docx/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (extname && allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new Error('Only PDF and DOCX resume files are allowed.'), false);
};

const uploadResumeForATS = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).single('resume');

router.post('/analyze', auth, uploadResumeForATS, analyzeResumeAndStoreATS);
router.get('/my-analyses', auth, getMyResumeATSAnalyses);
router.get('/:id', auth, getResumeATSAnalysisById);

module.exports = router;