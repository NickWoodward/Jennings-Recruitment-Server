const { validationResult } = require('express-validator');
const Job = require('../models/job');
const Person = require('../models/person');
const Applicant = require('../models/applicant');
const Application = require('../models/application');
const Company = require('../models/company');

const util = require('util');

exports.apply = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation error, incorrect data');
        error.statusCode = 422;
        console.log(errors.array());
        error.validationArray = errors.array();
        throw error;
    }
    // if(!req.file) {
    //     const error = new Error('No cv provided');
    //     error.statusCode = 422;
    //     throw error;
    // }

    const jobId = req.params.id;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phone = req.body.phone;
    const email = req.body.email;
    const cvUrl = req.file? req.file.filename : null;

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
                return Applicant.create({ personId: currentPerson.id, cvUrl });
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
                error.email = currentPerson.email;
                error.statusCode = 422;
                throw error;
            }
            return currentApplicant.addJob(currentJob);
        }) 
        .then(application => {
            if(!application){
                throw new Error('Error creating application. Please contact us directly');
            } else {
                res.status(201).json({ msg: 'Application successful', ref: `JRS-03-${application[0].id}` });
            }
        }) 
        .catch(err => {
            next(err)
        });
};

exports.getApplications = (req, res, next) => {
    // Application.findAll()
    //     .then(applications => {
    //         console.log(applications[0].dataValues);

    //         res.status(200).json({applications: applications});
    //     })
    // .catch(err => console.log(err)); 

    // Use the {include} option to get the relavant model for each job rather than querying the Application table
    Job.findAll({ 
        include: [
            {
                model: Applicant, 
                include: { model: Person },
               
                // order: [ [Applicant,  'applicantId', 'DESC'] ]

            },
            Company
        ], 
        order: [ [ Applicant, Application,  'createdAt', 'DESC'] ]

    }).then(results => {
        // For each job, create an entry for each applicant to that job
        // console.log(`>`, util.inspect(results[0], true, 1, true));
        // console.log(Object.keys(results[0].__proto__));


        const jobEntries = results.map(({ dataValues, dataValues: { company: {name: companyName, id: companyId}, id: jobId, title, applicants } }, index) => {
            // console.log(`${index}>`, util.inspect(applicants[0], true, 2, true));

            const application = applicants.map(({ cvUrl, id:applicantId, personId, person: { firstName, lastName }, application: {id:applicationId} }) =>  { 
                return { company: companyName, companyId, applicationId, jobId, applicantId, position: title, personId, firstName, lastName, cvUrl } 
            });
            return application
        }).flat();
        res.status(200).json({msg: 'success', applications: jobEntries});
    }).catch(err => console.log(err));
};
