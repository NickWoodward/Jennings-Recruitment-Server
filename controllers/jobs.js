const { validationResult } = require('express-validator');
const Sequelize = require('sequelize');


const Job = require('../models/job');
const { json } = require('body-parser');
const { where } = require('sequelize');

let totalJobs = countJobs();

    // #TODO: Move to admin controller
exports.createJob = (req, res, next) => {
    const err = validationResult(req);
    if(!err.isEmpty()) {
        const error = new Error('Validation failed, incorrect data');
        error.validationErrors = err.array();
        error.statusCode = 422;

        throw error;
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
        totalJobs++;
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

    // Job.findAll({ where: { featured: true } })
    //     .then(jobs => {
    //         res.status(200).json({
    //             jobs: jobs,
    //             message: 'Featured jobs found'
    //         });
    //     })
    //     .catch(err => console.log(err));
    console.log('featured');
};

exports.getJob = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, incorrect data');
        error.statusCode = 422;
        error.validationErrors = errors.array();

        throw error;
    }

    Job.findByPk(req.params.id)
        .then(job => {
            if(job) return res.status(200).json({ message: "Job found", job });
            throw new Error('Job not found');
        }).catch(e => {
            if(!e.statusCode) e.statusCode = 500; 
            next(e);
        });
};

// #TODO: Sanitise inputs?
exports.getJobs = (req, res, next) => {
    console.log(req.query.titles);
    const index = req.query.index;
    const limit = req.query.limit;
    const titles = req.query.titles;
    const locations = req.query.locations;
    const orderField = req.query.orderField;
    const orderDirection = req.query.orderDirection;


    const whereOptions = {};

    if(titles) whereOptions.title = { [Sequelize.Op.or]: titles};
    if(locations) whereOptions.location = { [Sequelize.Op.or]: locations };

    // Return Jobs
    Job.findAll({
        where: whereOptions,
        limit: parseInt(limit, 10),
        offset: parseInt(index),
        order: [[orderField, orderDirection]]
    })
    .then(response => {
        res.status(200).json({
            jobs: response,
            message: `${response.length} ${response.length === 1? ' job':' jobs'} found`,
            totalJobs: totalJobs
        });
    })
    .catch(err => console.log(err));
};

exports.getMenuData = (req, res, next) => {
    Job.findAll({
        attributes: ['title', 'location'],
        group: ['title', 'location']
    })
    // Job.aggregate('title', 'DISTINCT', { plain: false })
    .then(response => {
        const titles = response.map(job => job.dataValues.title);
        const uniqueTitles = [...new Set(titles)];

        const locations = response.map(location => location.dataValues.location);
        const uniqueLocations = [...new Set(locations)];
        
        res.status(200).json({
            response: { uniqueTitles, uniqueLocations }
        })
    })
    .catch(err => console.log(err));
};


function countJobs() {
    Job.findAll().then((jobs) => {
        totalJobs = jobs.length;
    })
    .catch(err => console.log(err));
};