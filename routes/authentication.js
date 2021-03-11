const express = require('express');
const router = express.Router();
const passport = require('passport');

const auth = require('../controllers/auth');

router.post('/login', auth.login);

router.post('/register', auth.register);

router.get('/test', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.status(200).json({ success: true, message: 'fucking get in' });
});

module.exports = router;