const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const auth = require('../controllers/auth');

router.post('/login', [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter an email address')
        .normalizeEmail(),
    body('password')
        .trim()
], auth.loginAdmin);

router.post('/logout', auth.logoutAdmin);

router.get('/test', (req, res, next) => {
    res.status(200).json({ success: true, message: 'fucking get in' });
});

module.exports = router;