const express = require('express');
const router = express.Router();
const multer = require('multer');


const contactController = require('../controllers/contact');

router.post('/', multer().none(),  contactController.submitContactForm);

module.exports = router;