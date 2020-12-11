const express = require('express');
const { body } = require('express-validator');

const jobsController = require('../controllers/jobs');

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

// POST /jobs/job
router.post('/job', [
    body('title')
        .trim()
        .isString()
        .isLength({ min: 3 })
        .withMessage('Enter a title over 3 characters'),
    body('wage')
        .trim()
        .isFloat()
        .withMessage('Enter a number')
        .isLength({ min: 5 })
        .withMessage('Wage must be over 5 digits'),
    body('location')
        .trim()
        .isLength({ min: 5 })
        .withMessage('Enter a location over 5 characters'),
    body('description')
        .trim()
        .isLength({ min: 5 })
        .withMessage('Enter a description over 5 characters'),
] , jobsController.createJob);

module.exports = router;