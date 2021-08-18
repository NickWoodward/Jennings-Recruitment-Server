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
router.get('/company/:id', adminController.getCompany);


// @TODO: validation
router.post('/create/applicant/', uploadFile('cv'), adminController.createApplicant);

// @TODO: validation
router.post('/edit/applicant/:id', uploadFile('cv'), adminController.editApplicant);

router.post('/edit/job/:id', multer().none(), 
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
adminController.editJob);

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
router.post('/create/company', multer().none(), [
    body('companyName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({ min: 1, max: 50 })
        .withMessage('Enter a company name between 1 and 50 characters'),
    body('firstName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .withMessage('Enter a string')
        .isLength({ min: 2, max: 50 })
        .withMessage('Enter a first name between 2 and 50 characters'),
    body('lastName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({ min: 2, max: 50 })
        .withMessage('Enter a last name between 2 and 50 characters'),
    body('position')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({  min: 2, max: 50 })
        .withMessage('Enter a last name between 2 and 50 characters'),
    body('phone')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({ min: 9, max: 12 })
        .withMessage('Must be between 9 and 12 characters')
        .custom(value => {
            const start = value.substring(0,2);
            if(
                start != '07' &&
                start != '01' && 
                start != '02' &&
                start != '03' &&
                start != '08'
            ) throw new Error('Please enter a valid UK phone number');
            
            return true;
        }),
    body('email')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .isLength({ min: 4, max: 50 })
        .withMessage('Please enter an email between 4 and 50 characters')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail({ all_lowercase: true }),
    body('firstLine')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({ min: 1, max: 50 })
        .withMessage('Please enter a value between 1 and 50 characters'),
    body('secondLine')
        .optional({ checkFalsy: true })
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({ min: 2, max: 50 })        
        .withMessage('Please enter a value between 2 and 50 characters'),
    body('city')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({ min: 3, max: 60 })
        .withMessage('Please enter a value between 3 and 60 characters'),
    body('county')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({ min: 2, max: 50 })        
        .withMessage('Please enter a county between 2 and 50 characters'),
    body('postcode')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .trim()
        .escape()
        .isLength({ min: 5, max: 8 })        
        .withMessage('Please enter a postcode between 5 and 8 characters'),
],
adminController.createCompany);

// body('firstName')
// .trim()
// .escape()
// .isEmail()
// .withMessage('Type error')
// .isLength({ min: 2, max: 5 })
// .withMessage('Length error'),
// body('email')
// .trim()
// .isEmail()
// .withMessage('Please enter a valid email address')
// .normalizeEmail({ all_lowercase: true })
// .isLength({ min: 4, max: 50 })
// .withMessage('Please enter an email between 4 and 50 characters'),

//  [
//     body('companyName')
//         .trim()
//         .escape()
//         .isString()
//         .isLength({ min: 1, max: 50 })
//         .withMessage('Enter a company name between 1 and 50 characters'),
//     body('firstName')
//     // .trim()
//     // .escape()
//         .isString()
//         .withMessage('Enter a string')
//         .isLength({ min: 2, max: 50 })
//         .withMessage('Enter a first name between 2 and 50 characters'),
//         // .trim()
//         // .escape()
//         // .isString()
//         // .withMessage('Please enter only characters')
//         // .isLength({ min: 2, max: 50 })
//         // .withMessage('Enter a first name between 2 and 50 characters'),
//     body('lastName')
//         .trim()
//         .escape()
//         .isString()
//         .isLength({ min: 2, max: 50 })
//         .withMessage('Enter a last name between 2 and 50 characters'),
//     body('phone')
//         .trim()
//         .escape()
//         .isLength({ min: 9, max: 12 })
//         .withMessage('Must be between 9 and 12 characters')
//         .custom(value => {
//             const start = value.substring(0,2);
//             if(
//                 start != '07' &&
//                 start != '01' && 
//                 start != '02' &&
//                 start != '03' &&
//                 start != '08'
//             ) throw new Error('Please enter a valid UK phone number');
            
//             return true;
//         }),
//     body('email')
//         .trim()
//         .isEmail()
//         .withMessage('Please enter a valid email address')
//         .normalizeEmail({ all_lowercase: true })
//         .isLength({ min: 4, max: 50 })
//         .withMessage('Please enter an email between 4 and 50 characters'),
//     body('firstLine')
//         .trim()
//         .escape()
//         .isString()
//         .isLength({ min: 1, max: 50 })
//         .withMessage('Please enter a value between 1 and 50 characters'),
//     body('secondLine')
//         .optional({ checkFalsy: true })
//         .trim()
//         .escape()
//         .isLength({ min: 2, max: 50 })        
//         .withMessage('Please enter a value between 2 and 50 characters'),
//     body('city')
//         .trim()
//         .escape()
//         .isString()
//         .isLength({ min: 3, max: 60 })
//         .withMessage('Please enter a value between 3 and 60 characters'),
//     body('county')
//         .trim()
//         .escape()
//         .isLength({ min: 2, max: 50 })        
//         .withMessage('Please enter a county between 2 and 50 characters'),
//     body('postcode')
//         .trim()
//         .escape()
//         .isLength({ min: 5, max: 8 })        
//         .withMessage('Please enter a postcode between 5 and 8 characters'),
// ],

router.delete('/delete/applicant/:id', adminController.deleteApplicant);
router.delete('/delete/job/:id', adminController.deleteJob);
router.delete('/delete/company/:id', adminController.deleteCompany);



module.exports = router;