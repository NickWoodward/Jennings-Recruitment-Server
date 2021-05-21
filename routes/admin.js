const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin');

router.get('/applicants', adminController.getApplicants);
router.get('/cvs/:applicantId', adminController.getCv);

module.exports = router;