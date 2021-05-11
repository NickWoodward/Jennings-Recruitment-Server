const express = require('express');
const { body, param } = require('express-validator');

const jobsController = require('../controllers/jobs');
const applicationController = require('../controllers/applications');

const router = express.Router();

// GET /jobs/all
// #TODO: validate options object and index
router.get('/all', 
    [ body('limit').isInt().not().isEmpty() ],
    jobsController.getJobs);

// GET /jobs/menudata 
router.get('/menudata', jobsController.getMenuData); 

// GET /jobs/featured
router.get('/featured', jobsController.getFeaturedJobs);


// GET /jobs/:id
router.get('/:id', jobsController.getJob);

// POST /jobs/create
router.post('/create', [
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
        .isLength({ min: 5, max: 20 })
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
] , jobsController.createJob);

// POST /jobs/edit/id
router.post('/edit/:id', [
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
    .isLength({ min: 5, max: 20 })
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
], jobsController.editJob);

// DELETE /jobs/delete 
router.delete('/delete/:id', jobsController.deleteJob);

// POST /jobs/apply/id
router.post('/apply/:id', [
    param('id')
        .exists()
        .withMessage('No jobId provided')
        .trim()
        .escape()
        .isInt()
        .withMessage('No jobId provided')
        .custom(value => {
            if(value < 1) throw new Error('Parameter must be greater than 0');
            return true;
        }),
    body('firstName')
        .trim()
        .escape()
        .isLength({ min: 2, max: 50 })
        .withMessage('Must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .escape()
        .isLength({ min: 2, max: 50})
        .withMessage('Must be between 2 and 50 characters'),
    body('phone')
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
        // @TODO: Add validation to cvURL
        // @TODO: Check if this needs escaping
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail()
        .isLength({ max: 50 })

], applicationController.apply);

module.exports = router;