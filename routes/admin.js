const express = require('express');
const router = express.Router();

const { uploadFile } = require('../middleware/multer');
const multer = require('multer');

const adminController = require('../controllers/admin');

router.get('/applicants', adminController.getApplicants);
router.get('/cvs/:applicantId', adminController.getCv);
router.get('/jobs',adminController.getJobs);
router.get('/companies', adminController.getCompanies);


// @TODO: validation
router.post('/edit/applicant/:id', uploadFile('cv'), adminController.editApplicant);
// @TODO: add validation
router.post('/edit/job/:id', multer().none(), adminController.editJob);
// @TODO: add validation
router.post('/create/job', multer().none(), adminController.createJob);

router.delete('/delete/applicant/:id', adminController.deleteApplicant);
router.delete('/delete/job/:id', adminController.deleteJob);



module.exports = router;