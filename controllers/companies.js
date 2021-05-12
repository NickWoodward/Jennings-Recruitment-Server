const Company = require('../models/company');

exports.getCompanies = (req, res, next) => {
    Company.findAll()
        .then(companies => {
            res.status(200).json({msg: 'success', companies: companies});
        })
        .catch(err => console.log(err));
}