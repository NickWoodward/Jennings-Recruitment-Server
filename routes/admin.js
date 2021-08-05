const express = require('express');
const router = express.Router();

const { uploadFile } = require('../middleware/multer');
const multer = require('multer');
const { body, param } = require('express-validator');


const adminController = require('../controllers/admin');

router.get('/applicants', adminController.getApplicants);
router.get('/cvs/:applicantId', adminController.getCv);
router.get('/jobs',adminController.getJobs);
router.get('/companies', adminController.getCompanies);


// @TODO: validation
router.post('/create/applicant/', uploadFile('cv'), adminController.createApplicant);

// @TODO: validation
router.post('/edit/applicant/:id', uploadFile('cv'), adminController.editApplicant);
// @TODO: add validation
router.post('/edit/job/:id', multer().none(), adminController.editJob);

router.post('/create/job', multer().none(), 
    [ 
        body('title')
            .trim()
            .escape()
            .isString()
            .isLength({ min: 3, max: 50 })
            .withMessage('Enter a title between 3 and 50 characters'),
        body('wage')
            .trim()
            .escape()
            .isFloat()
            .withMessage('Enter a number')
            .isLength({ min: 5, max: 8 })
            .withMessage('Wage must be over 5 digits'),
        body('location')
            .trim()
            .escape()
            .isLength({ min: 3, max: 50 })
            .withMessage('Enter a location between 3 and 50 characters'),
        body('description')
            .trim()
            .escape()
            .isLength({ min: 5, max: 500 })
            .withMessage('Enter a description between 5 and 500 characters'),
        body('featured')
       
        .isFloat({ gt: -1, lt: 2 })
        .withMessage('Enter either a 0 or 1')
    ],
adminController.createJob);

// @TODO: add validation
router.post('/create/company', multer().none(), adminController.createCompany);

router.delete('/delete/applicant/:id', adminController.deleteApplicant);
router.delete('/delete/job/:id', adminController.deleteJob);
router.delete('/delete/company/:id', adminController.deleteCompany);



module.exports = router;