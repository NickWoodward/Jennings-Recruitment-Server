const { validationResult } = require('express-validator');

const Job = require('../models/job');


    // #TODO: Move to admin controller
exports.createJob = (req, res, next) => {
    const err = validationResult(req);

    if(!err.isEmpty()) {
        return res.status(422)
            .json({ 
                message: 'Validation failed', errors: err.array()
            });
    }

    const title = req.body.title;
    const wage = req.body.wage;
    const location = req.body.location;
    const description = req.body.description;
    const featured = true;
    
    Job.create({
        title: title,
        wage: wage,
        location: location,
        description: description,
        featured: featured
    })
    .then(result => {
        res.status(201).json({
            message: 'Job created sucessfully',
            job: { id: new Date().toISOString(), title: title, wage: wage, location: location, description: description, featured: featured }
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            message: 'Please contact your administrator'
        });
    });


};

exports.getFeaturedJobs = (req, res, next) => {

    Job.findAll({ where: { featured: true } })
        .then(jobs => {
            res.status(200).json({
                jobs: jobs,
                message: 'Featured jobs found'
            });
        })
        .catch(err => console.log(err));

};

exports.getJobs = (req, res, next) => {
    res.status(200).json(jobs);
};