const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const { validationResult } = require('express-validator');

const Application = require('../models/application');
const Applicant = require('../models/applicant');
const Person = require('../models/person');
const Job = require('../models/job');
const Company = require('../models/company');

exports.deleteApplicant = (req, res, next) => {
    Applicant.findOne({
        where: { personId: req.params.id },
        include: Person
    }).then(applicant => {
        if(!applicant) {
            const error = new Error();
            error.message = 'No User Found';
            error.statusCode = 404;
            next(error);
        }
        // Destroying the person cascades to the applicant and the applications
        return applicant.person.destroy();
    }).then(applicant => {
        res.status(204).json({ msg: `User ${applicant.id} deleted` });
    }).catch(err => {
        console.log(err);        
    }); 
};

exports.editApplicant = (req, res, next) =>{
    
    Applicant.findOne({
        where: { personId: req.params.id },
        include: Person
    }).then(applicant => {
            if(!applicant) { 
                const error = new Error();
                error.message = 'No User Found';
                error.statusCode = 404;
                next(error);
            }
            console.log(req.file);
            if(req.file) applicant.cvUrl = req.file.filename;
            
            return applicant.save();

        }).then(applicant => {
            const person = applicant.person;

            if(!person) {
                const error = new Error();
                error.message = 'No Person Found';
                error.statusCode = 404;
            }

            person.firstName = req.body.firstName;
            person.lastName = req.body.lastName;
            person.phone = req.body.phone;
            person.email = req.body.email;
                    
            return person.save();
        }).then(result => {
            res.status(200).json({ result });
        })
        .catch(err => {
            console.log(err);
        });
};

const deleteCv = (filePath) => {

}; 

exports.getApplicants = (req, res, next) => {

    const index = req.query.index || 0;
    const limit = req.query.limit || 10;

    Applicant.findAndCountAll({
        limit: parseInt(limit, 10),
        offset: parseInt(index),
        attributes: [
            'id',
            'cvUrl',
            [Sequelize.fn('date_format', Sequelize.col('applicant.createdAt' ), '%d/%m/%y'), 'createdAt']
        ],
        include: [
            {
                model: Job,
                include: [ 
                    {
                        model: Company,
                        attributes: [ 'id', 'name' ]
                    } 
                ],
                attributes: [ 'id', 'title', 'location' ]
            },
            {
                model: Person,
                attributes: [ 'firstName', 'lastName', 'phone', 'email' ]
            }
        ], 
        
    })
        .then(applicants => {
            if(applicants) {
                applicants.rows = applicants.rows.map(({ 
                    id:applicantId, 
                    createdAt, 
                    jobs,
                    person: { firstName, lastName, phone, email },
                    cvUrl
                }) => {
                    const cvType = cvUrl? cvUrl.slice(cvUrl.lastIndexOf('.')):null;
                    const cvName = cvUrl? cvUrl.slice(12): 'No CV uploaded';
                    // Format jobs array
                    jobs = jobs.map(({ id:jobId, title, location, company: { id:companyId, name: companyName } }) => {
                        return { jobId, title, location, companyId, companyName };
                    });
                    // Format containing applicant
                    return { applicantId, firstName, lastName, phone, email, cvType, cvName, createdAt, jobs };
                });
                
                res.status(200).json({ applicants: applicants.rows, total: applicants.count });
            }
        }).catch(err => console.log(err));

};

exports.getCv = (req, res, next) => {
    Applicant.findOne({ where: { id: req.params.applicantId } })
        .then(applicant => {
            if(applicant && applicant.cvUrl) {
                const cvName = applicant.cvUrl;
                const cvPath = path.resolve(`cvs/${cvName}`);

                const cvReadStream = fs.createReadStream(cvPath);
                res.header('Content-Disposition', `attachment; filename=${cvName}`);

                cvReadStream.on('open', () => {
                    res.status(200);
                    cvReadStream.pipe(res);
                })
                
                cvReadStream.on('error', (err) => {
                    err.statusCode = 404;
                    err.message = 'File not found';
                    next(err);
                })
            } else {
                const error = new Error('No such applicant');
                error.statusCode = 404;
                next(error);
            }
        })
        .catch(err => {
            console.log(err);
        });

   
};

exports.getJobs = (req, res, next) => {
    Job.findAndCountAll({
        attributes: [
            'id',
            'title',
            'wage',
            'location',
            'description',
            'featured',
            [Sequelize.fn('date_format', Sequelize.col('job.createdAt' ), '%d/%m/%y'), 'createdAt'],
            'companyId'
        ],
        distinct: true,
        include: [ 
            {
                model: Company,
                attributes: ['name', 'address']
            }, 
            {
                model: Applicant,
                attributes: [
                    'id', 
                    'cvUrl', 
                    'personId',
                    [Sequelize.fn('date_format', Sequelize.col('applicants.createdAt' ), '%d/%m/%y'), 'createdAt'],
                ],
                include: [ 
                    {
                        model: Person,
                        attributes: [ 'firstName', 'lastName', 'phone', 'email' ]
                    } 
                ] 
            }
        ]
    })
    .then(jobs => {
        jobs.rows = jobs.rows.map(({
            id, title, wage, location, description, featured, createdAt: jobDate, companyId,
            company: { name: companyName, address: companyAddress },
            applicants,
        }) => {
            applicants = applicants.map(({ id, cvUrl, createdAt: appliedDate, personId, person: { firstName, lastName, phone, email } }) => {
                const cvType = cvUrl? cvUrl.slice(cvUrl.lastIndexOf('.')):null;
                const cvName = cvUrl? cvUrl.slice(12): 'No CV uploaded';

                return { id, personId, firstName, lastName, cvType, cvName, appliedDate, phone, email };
            });
            
            return { 
                id,
                title, 
                wage, 
                location, 
                description, 
                featured, 
                jobDate,
                companyId, 
                companyName, 
                companyAddress,
                applicants
             };
        });

        res.status(200).json({ msg: 'Success', jobs: jobs.rows, total: jobs.count });
    })
    .catch(err => {
        throw err;
    });
};

// @TODO: add validation
exports.editJob = (req, res, next) => {
    console.log(req.body);
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        const error = new Error();
        error.message = 'Validation Error';
        error.statusCode = 422;

        throw (error);
    }

    Job.findOne({
        where: { id: req.params.id },
        include: Company 
    })
    .then(job => {
        if(!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        job.title = req.body.title;
        job.wage = req.body.wage;
        job.location = req.body.location;
        job.description = req.body.description;
        job.featured = req.body.featured;
        
        return job.save();
    }).then(job => {
        const company = job.company;
        company.name = req.body.companyName;
        console.log(company.name);
        return company.save();
    })
    .then(company => {
        res.status(200).json({ message: 'Job edited' });
    })
    .catch(err => console.log(err));
};

// @TODO: add validation
exports.createJob = (req, res, next) => {
    const errors = validationResults(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation Error');
        error.statusCode = '422';
        throw error;
    }

    Job.create({
        title: req.body.title,
        wage: req.body.wage,
        location: req.body.location,
        description: req.body.description,
        feature: req.body.featured
    }).then(job => {

    }).catch(err => console.log(err));
};

exports.getCompanies = (req, res, next) => {
    Company.findAll({
        attributes: [ 
            'id', 
            'name',
            [Sequelize.fn('date_format', Sequelize.col('company.createdAt' ), '%d/%m/%y'), 'createdAt']
        ]
    }).then(companies => {
        res.status(200).json({ message: 'Success', companies });
    }).catch(err => {
        throw err;
    });
};

