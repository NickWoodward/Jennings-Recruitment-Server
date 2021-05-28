const express = require('express');
const router = express.Router();

const { uploadFile } = require('../middleware/multer');

const adminController = require('../controllers/admin');

router.get('/applicants', adminController.getApplicants);
router.get('/cvs/:applicantId', adminController.getCv);

router.post('/applicants/:id', uploadFile('cv'), adminController.editApplicant)

module.exports = router;