const express = require('express');
const router = express.Router();

const { uploadFile } = require('../middleware/multer');
const multer = require('multer');
const { body, param } = require('express-validator');
const { Op } = require("sequelize");

const adminController = require('../controllers/admin');
const Person = require('../models/person');
const Contact = require('../models/contact');

router.get('/applicants', adminController.getApplicants);
router.get('/applicantnames', adminController.getApplicantNames);
router.get('/cvs/:applicantId', adminController.getCv);
router.get('/jobs',adminController.getJobs);
router.get('/jobnames', adminController.getJobNames);
router.get('/companies', adminController.getCompanies);
router.get('/companyNames', adminController.getCompanyNames);
router.get('/company/:id', adminController.getCompany);
router.get('/applications', adminController.getApplications);

// @TODO: validation
router.post('/create/applicant/', uploadFile('cv'), adminController.createApplicant);

router.post('/create/application/:jobId/:personId', adminController.createApplication);

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
    body('companyName')
        .optional({ checkFalsy: true })
        .trim()
        .escape()
        .isString()
        .isLength({ min: 2, max: 50 })
        .withMessage('Company Name must be between 2 and 50 characters'),
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
    body('type')
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
        .isLength({ min: 1, max: 50})
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
router.post('/edit/company', multer().none(), 
[
    body('id')
        .isFloat({ gt: 0 })
        .withMessage('Must be a number'),
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
        body("phone")
        .isString()
        .custom(value => value.replace(/\s*/g, "")
                                .match(/^0([1-6][0-9]{8,10}|7[0-9]{9})$/))
        .withMessage("Please enter a UK phone number"),
    body('email')
        .isString()
        .withMessage('Invalid characters, please use letters and numbers only')
        .isLength({ min: 4, max: 50 })
        .withMessage('Please enter an email between 4 and 50 characters')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail({ all_lowercase: true })
        .custom(async (value, {req}) => {
            try{
                const person = await Person.findOne({ where: { email: value } });
                let contact;
                if(person) {
                    // if the contact 
                    contact = await Contact.findOne({ where: { personId: person.id, companyId: {[Op.not]:req.body.id }} });
                }
                if(contact) return Promise.reject('Already a contact email address'); 

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
adminController.editCompany);


// @TODO: Update validation
router.post('/create/job', multer().none(),
    [ 
        body('companyId')
            .isFloat({ gt: 0 })
            .withMessage('Must be a number'),
        body('companyName')
            .optional({ checkFalsy: true })
            .trim()
            .escape()
            .isString()
            .isLength({ min: 2, max: 50 })
            .withMessage('Company Name must be between 2 and 50 characters'),
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
        body('type')
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
            .isFloat({ gt: 0, lt: 11 })
            .withMessage('Enter a number between 1 and 10'),
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
        body("phone")
        .isString()
        .custom(value => value.replace(/\s*/g, "")
                                .match(/^0([1-6][0-9]{8,10}|7[0-9]{9})$/))
        .withMessage("Please enter a UK phone number"),
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
                let contact;
                if(person) {
                    contact = await Contact.findOne({ where: { personId: person.id } });
                }
                if(contact) return Promise.reject('Already a contact email address'); 

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

router.post('/create/contact', multer().none(), [
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
    body("phone")
        .isString()
        .custom(value => value.replace(/\s*/g, "")
                                .match(/^0([1-6][0-9]{8,10}|7[0-9]{9})$/))
        .withMessage("Please enter a UK phone number"),
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
                let contact;
                if(person) {
                    contact = await Contact.findOne({ where: { personId: person.id } });
                }
                if(contact) return Promise.reject('Already a contact email address'); 

            } catch(err) {
                throw err;
            }
        })
        .trim(),
], adminController.createContact);

router.post('/create/address', multer().none(), [
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

], adminController.createAddress);

router.delete('/delete/applicant/:id', adminController.deleteApplicant);
router.delete('/delete/application/:id', adminController.deleteApplication);
router.delete('/delete/job/:id', adminController.deleteJob);
router.delete('/delete/company/:id', adminController.deleteCompany);



module.exports = router;