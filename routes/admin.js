const express = require('express');
const router = express.Router();

const { uploadFile } = require('../middleware/multer');
const multer = require('multer');
const { body, param } = require('express-validator');


const adminController = require('../controllers/admin');
const Person = require('../models/person');

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
    body('jobType')
        .isString()
        .withMessage('Please enter alphanumeric characters')
        .isLength({ min: 2, max: 50})
        .withMessage('Job Type must be between 2 and 50 characters')
        .trim()
        .escape(),
    body('position')
        .isString()
        .withMessage('Please enter alphanumeric characters')
        .isLength({ min: 2, max: 50})
        .withMessage('Position must be between 2 and 50 characters')
        .trim()
        .escape(),
    body('pqe')
        .isString()
        .withMessage('Please enter alphanumeric characters')
        .isLength({ min: 2, max: 50})
        .withMessage('PQE must be between 2 and 50 characters')
        .trim()
        .escape(),
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

// @TODO: add param validation
router.post('/edit/company/:id/:contactId/:addressId', multer().none(), 
[
    body('companyName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 1, max: 50 })
        .withMessage('Enter a company name between 1 and 50 characters')
        .trim()
        .escape(),
    body('firstName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 2, max: 50 })
        .withMessage('Enter a first name between 2 and 50 characters')
        .trim()
        .escape(),
    body('lastName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 2, max: 50 })
        .withMessage('Enter a last name between 2 and 50 characters')
        .trim()
        .escape(),
    body('position')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({  min: 2, max: 50 })
        .withMessage('Enter a last name between 2 and 50 characters')
        .trim()
        .escape(),
    body('phone')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
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
        })
        .trim()
        .escape(),
    body('email')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 4, max: 50 })
        .withMessage('Please enter an email between 4 and 50 characters')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail({ all_lowercase: true })
        .trim(),
    body('firstLine')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 1, max: 50 })
        .withMessage('Please enter a value between 1 and 50 characters')
        .trim()
        .escape(),
    body('secondLine')
        .optional({ checkFalsy: true })
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 2, max: 50 })        
        .withMessage('Please enter a value between 2 and 50 characters')
        .trim()
        .escape(),
    body('city')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 3, max: 60 })
        .withMessage('Please enter a value between 3 and 60 characters')
        .trim()
        .escape(),
    body('county')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 2, max: 50 })        
        .withMessage('Please enter a county between 2 and 50 characters')
        .trim()
        .escape(),
    body('postcode')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 5, max: 8 })        
        .withMessage('Please enter a postcode between 5 and 8 characters')
        .trim()
        .escape()
], 
adminController.editCompany);


// @TODO: Update validation
router.post('/create/job', multer().none(),
    [ 
        body('title')
            .isString()
            .isLength({ min: 3, max: 50 })
            .withMessage('Enter a title between 3 and 50 characters')
            .trim()
            .escape(),
        body('wage')
            .isFloat()
            .withMessage('Enter a number')
            .isLength({ min: 5, max: 8 })
            .withMessage('Wage must be over 5 digits'),
            
        body('location')
            .isLength({ min: 3, max: 50 })
            .withMessage('Enter a location between 3 and 50 characters')
            .trim()
            .escape(),
        body('jobType')
            .isString()
            .withMessage('Please enter alphanumeric characters')
            .isLength({ min: 2, max: 50})
            .withMessage('Job Type must be between 2 and 50 characters')
            .trim()
            .escape(),
        body('position')
            .isString()
            .withMessage('Please enter alphanumeric characters')
            .isLength({ min: 2, max: 50})
            .withMessage('Position must be between 2 and 50 characters')
            .trim()
            .escape(),
        body('pqe')
            .isString()
            .withMessage('Please enter alphanumeric characters')
            .isLength({ min: 2, max: 50})
            .withMessage('PQE must be between 2 and 50 characters')
            .trim()
            .escape(),
        body('description')
            .isLength({ min: 5, max: 500 })
            .withMessage('Enter a description between 5 and 500 characters')
            .trim()
            .escape(),
        body('featured')      
        .isFloat({ gt: -1, lt: 2 })
        .withMessage('Enter either a 0 or 1')
    ],
adminController.createJob);

router.post('/create/company', multer().none(), [
    body('companyName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 1, max: 50 })
        .withMessage('Enter a company name between 1 and 50 characters')
        .trim()
        .escape(),
    body('firstName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 2, max: 50 })
        .withMessage('Enter a first name between 2 and 50 characters')
        .trim()
        .escape(),
    body('lastName')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 2, max: 50 })
        .withMessage('Enter a last name between 2 and 50 characters')
        .trim()
        .escape(),
    body('position')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({  min: 2, max: 50 })
        .withMessage('Enter a last name between 2 and 50 characters')
        .trim()
        .escape(),
    body('phone')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
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
        })
        .trim()
        .escape(),
    body('email')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 4, max: 50 })
        .withMessage('Please enter an email between 4 and 50 characters')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail({ all_lowercase: true })
        .custom(async value => {
            try{
                const person = await Person.findOne({ where: { email: value } });
                if(person) return Promise.reject('Email already exists'); 

            } catch(err) {
                throw err;
            }
        })
        .trim(),
    body('firstLine')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 1, max: 50 })
        .withMessage('Please enter a value between 1 and 50 characters')
        .trim()
        .escape(),
    body('secondLine')
        .optional({ checkFalsy: true })
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 2, max: 50 })        
        .withMessage('Please enter a value between 2 and 50 characters')
        .trim()
        .escape(),
    body('city')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 3, max: 60 })
        .withMessage('Please enter a value between 3 and 60 characters')
        .trim()
        .escape(),
    body('county')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 2, max: 50 })        
        .withMessage('Please enter a county between 2 and 50 characters')
        .trim()
        .escape(),
    body('postcode')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 5, max: 8 })        
        .withMessage('Please enter a postcode between 5 and 8 characters')
        .trim()
        .escape(),
],
adminController.createCompany);

router.delete('/delete/applicant/:id', adminController.deleteApplicant);
router.delete('/delete/job/:id', adminController.deleteJob);
router.delete('/delete/company/:id', adminController.deleteCompany);



module.exports = router;