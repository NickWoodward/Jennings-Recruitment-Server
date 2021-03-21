const express = require('express');
const { body, param } = require('express-validator');

const jobsController = require('../controllers/jobs');

const router = express.Router();

// GET /jobs/all
// #TODO: validate options object and index
router.get('/all', 
    [ body('limit').isInt().not().isEmpty() ],
    jobsController.getJobs);

// GET /jobs/:id
router.get('/:id', [
    param('id')
        .exists()
        .withMessage('Please provide an id')
        .isInt()
        .withMessage('Must be a number')
        .custom(value => {
            if(value < 1) throw new Error('Parameter must be greater than 0');
            return true;
        })
        .trim()
        .escape()
], jobsController.getJob);

// GET /jobs/menudata 
router.get('/menudata', jobsController.getMenuData); 

// GET /jobs/featured
router.get('/featured', jobsController.getFeaturedJobs);

// POST /jobs/job
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

module.exports = router;