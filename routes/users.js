const express = require("express");
const { body, param } = require('express-validator');

const userController = require("../controllers/people");

const User = require('../models/person');

const router = express.Router();

router.get("/all", userController.getUsers);
router.get("/headers", userController.getUserHeaders);

router.get("/:id", userController.getUser);


router.post("/edit/:id", [
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
],
userController.editUser);

// @TODO: cv validation
router.post("/register",
    [
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
            .custom((value, {req}) => {
                return User.findOne({where: {email: value}})
                    .then(user => {
                        if(user) return Promise.reject('Email already in use');
                    })
            }),
            
        // No required escaping because of bcrypt
        body('password')
            .trim()
            .isLength({ min: 12, max: 30 })
            .withMessage('Please enter a password between 12 and 30 characters'),
        body('confirmPassword')
            .trim()
            .isLength({ min: 12, max: 30 })
            .custom((value, { req }) => {
                if(value !== req.body.password) throw new Error("Passwords don't match");

                return true;
            })
    ],
    userController.registerUser
);

// @TODO: add validation
router.post("/addHubspotUser/:id", userController.addToHubspot);

// @TODO: remove validation from routes that don't need it
router.delete("/delete/:id", [
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
], userController.deleteUser);

router.delete('/delete-email/:email', userController.deleteUserByEmail);

module.exports = router;
