const express = require('express');
const { body, param } = require('express-validator');
const applicationController = require('../controllers/applications');
const { uploadFile } = require('../middleware/multer');

const router = express.Router();

// GET /applications/all
router.get('/all', applicationController.getApplications);

// POST /applications/apply/id
router.post('/apply/:id', 
uploadFile('cv'),

[
    param('id')
        .exists()
        .withMessage('No jobId provided')
        .isInt()
        .withMessage('No jobId provided')
        .custom(value => {
            if(value < 1) throw new Error('Parameter must be greater than 0');
            return true;
        }) 
        .escape(),
    body('firstName')
        .isLength({ min: 2, max: 50 })
        .withMessage('Must be between 2 and 50 characters')
        .trim()
        .escape(),
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

], 
applicationController.apply);


module.exports = router;