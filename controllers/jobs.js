const { validationResult } = require('express-validator');
const Sequelize = require('sequelize');


const Job = require('../models/job');
const io = require('../util/socket');


let totalJobs;

exports.editJob = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation error');
        error.statusCode = 422;
        error.validationArray = errors.array();
        throw error;
    }
    Job.findByPk(req.params.id)
        .then(job => {
            if(job) {
                job.title = req.body.title;
                job.wage = req.body.wage;
                job.location = req.body.location;
                job.description = req.body.description;

                return job.save();
            } else {
                res.status(400).json({ message: 'Job not found' });
            }
        })
        .then(job => {
            if(job)
                res.status(200).json({ message: 'Job updated', job });
        })
        .catch(err => {
            if(!err.statusCode) err.statusCode = 500;
            next(err);
        });
};

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
    const featured = false;
    
    Job.create({
        title: title,
        wage: wage,
        location: location,
        description: description,
        featured: featured
    })
    .then(job => {
        const jobId = job.dataValues.id;
        const createdAt = job.dataValues.createdAt;

        io.getIO().emit('job', { action: 'create', job: {jobId, title, wage, location} });

        res.status(201).json({
            message: 'Job created sucessfully',
            job: { id: jobId, title: title, wage: wage, location: location, description: description, createdAt: createdAt }
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            message: 'Please contact your administrator'
        });
    });
};

exports.deleteJob = (req, res, next) => {
    Job.findByPk(req.params.id)
        .then(job => {
            if(job) {
                return job.destroy();
            } else {
                res.status(404).json({ message: 'Cannot find job' });
            }
        })
        .then(response => {
            if(response) res.status(200).json({ message: 'Job deleted', job: response.dataValues})
        })
        .catch(err => {
            if(!err.statusCode) err.statusCode = 500;
            next(err);
        });
};

exports.getFeaturedJobs = (req, res, next) => {
    console.log(req.session.isLoggedIn);

    console.log('User: ' + req.session.user);
    console.log('Session: ' + JSON.stringify(req.session));


    Job.findAll({ where: { featured: true } })
        .then(jobs => {
            res.status(200).json({
                jobs: jobs,
                message: 'Featured jobs found'
            });
        })
        .catch(err => console.log(err));
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

exports.getJobs = async (req, res, next) => {
    // console.log(req.session.isLoggedIn);
    // console.log(req.session.user);
    const index = req.query.index || 0;
    const limit = req.query.limit || 10;
    const titles = req.query.titles;
    const locations = req.query.locations;
    let salaries = req.query.salaries;
    const types = req.query.types;
    let pqes = req.query.pqes;
    const orderField = req.query.orderField;
    const orderDirection = req.query.orderDirection;

    const whereOptions = {};

    if(titles) whereOptions.title = { [Sequelize.Op.or]: titles};
    if(locations) whereOptions.location = { [Sequelize.Op.or]: locations };
    if(salaries) {
        salaries = req.query.salaries.map(s=> { 
            // Salaries comes in as an array of strings ['[20,30]','[1,2]']
            return {[Sequelize.Op.between]: JSON.parse(s) }
        });
        whereOptions.wage = { [Sequelize.Op.or]: salaries }
    }
    if(types) whereOptions.jobType = { [Sequelize.Op.or]: types };
    if(pqes) {

        pqes = pqes.map(pqe => { return parseInt(pqe) });
        // Find the lowest pqe
        const lowest = pqes.reduce((acc, item) => item < acc? item:acc );
        whereOptions.pqe = { 
            [Sequelize.Op.and]: {
                [Sequelize.Op.gt]: lowest 
            }
        };
    }
    


    // Return Jobs
    try {   
        const jobs = await Job.findAll({
            where: whereOptions,
            limit: parseInt(limit, 10),
            offset: parseInt(index),
            order: [[orderField, orderDirection]],

            attributes: [ 
                'id', 
                'title',
                'wage',
                'location',
                'description',
                'jobType',
                'position',
                'pqe',
                'createdAt',
                [Sequelize.fn('date_format', Sequelize.col('job.createdAt' ), '%d/%m/%y'), 'jobDate'],
            ],
        });

        const totalJobsInDB = await countJobs();

        res.status(200).json({
            jobs: jobs,
            message: `${jobs.length} ${jobs.length === 1? ' job':' jobs'} found`,
            totalJobs: jobs.length,
            totalJobsInDB
        });
    } catch(err) {
        console.log(err);
    }



    // .then(response => {
    //     console.log(response.length);
    //     res.status(200).json({
    //         jobs: response,
    //         message: `${response.length} ${response.length === 1? ' job':' jobs'} found`,
    //         totalJobs: response.length
    //     });
    // })
    // .catch(err => console.log(err));
};

exports.getMenuData = (req, res, next) => {
    Job.findAll({
        attributes: ['id', 'title', 'location'],
        group: ['title', 'location']
    })
    // Job.aggregate('title', 'DISTINCT', { plain: false })
    .then(response => {
        const titles = response.map(job => ({ id: job.id, title: job.dataValues.title }));
        // const uniqueTitles = [...new Set(titles)];

        const locations = response.map(location => ({ id: location.id, location: location.dataValues.location}));
        // const uniqueLocations = [...new Set(locations)];
        
        res.status(200).json({
            response: { 
                uniqueTitles: removeDuplicates(titles, 'title'), 
                uniqueLocations: removeDuplicates(locations, 'location') 
            }
        })
    })
    .catch(err => console.log(err));
};

function removeDuplicates(originalArray, propertyFilter) {
    const newArr = [];

    // { property: { id, property } }
    const lookupObj = {};

    // Extract the property filter prop out of the objects in the original array into the lookup object
    // Dupes will be removed
    originalArray.forEach((item, index) => {
        lookupObj[originalArray[index][propertyFilter]] = originalArray[index];
    });

    // Loop back over the object and push value to new array
    for(const i in lookupObj) {
        // console.log(lookupObj[i]);
        newArr.push(lookupObj[i]);
    }

    return newArr;
}

async function countJobs() {
    // return Job.findAll().then((jobs) => {
    //     console.log(jobs.length);
    //     totalJobs = jobs.length;
    // })
    // .catch(err => console.log(err));

    try {
        const jobs = await Job.findAll();
        return jobs.length;

    } catch(err) {
        console.log(err)
    }

};