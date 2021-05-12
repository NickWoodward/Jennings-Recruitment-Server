const express = require('express');

const router = express.Router();

const companyController = require('../controllers/companies');

router.get('/all', companyController.getCompanies);

module.exports = router;