const { validationResult } = require('express-validator');
const Job = require('../models/job');
const Person = require('../models/person');
const Applicant = require('../models/applicant');
const Application = require('../models/application');

exports.apply = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation error, incorrect data');
        error.statusCode = 422;
        console.log(errors.array());
        error.validationArray = errors.array();
        throw error;
    }

    const jobId = req.params.id;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phone = req.body.phone;
    const email = req.body.email;
    const cvUrl = req.body.cvUrl;

    let currentPerson;
    let currentApplicant;
    let currentJob;
    
    // Find the job
    Job.findByPk(jobId)
        .then(job => {
            if(!job) {
                const error = new Error('Error applying: No job found.');
                error.statusCode = 404;
                throw error;
            } else {
                currentJob = job;
                // Check if the Person applying exists already
                return Person.findOne({ where: { email: email } });
            }
        })
        .then(person => {
            // Create a new Person if they don't exist
            if(!person) return Person.create({ firstName, lastName, email, phone });
            else return person;
        })
        .then(person => {
            if(!person) {
                throw new Error('Error creating application. Please contact us directly');
            } else {
                currentPerson = person;
                // Check if they're an applicant
                // @TODO: does person.getApplicant(); work in its place?
                return Applicant.findOne({where: { personId: person.id }});
            }
        })
        .then(applicant => {
            // Create an applicant if they don't exist
            if(!applicant) {
                return Applicant.create({ personId: currentPerson.id });
            } else {
                return applicant;
            }
        })
        .then(applicant => {
            if(!applicant) {
                throw new Error('Error creating application. Please contact us directly');
            } else {
                currentApplicant = applicant;
                return applicant.hasJob(currentJob);
                // console.log(Object.keys(applicant.__proto__));
            }
        })
        .then(hasApplied => {
            if(hasApplied) {
                const error = new Error(`You've already applied to this job`);
                error.statusCode = 422;
                throw error;
            }
            return currentApplicant.addJob(currentJob);
        }) 
        .then(application => {
            if(!application){
                throw new Error('Error creating application. Please contact us directly');
            } else {
                res.status(201).json({ msg: 'Application successful', ref: `Reference JRS-03-${application.id}` });
            }
        }) 
        .catch(err => {
            console.log(err);
            next(err)
        });
};
