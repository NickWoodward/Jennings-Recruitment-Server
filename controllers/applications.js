const { validationResult } = require('express-validator');
const Job = require('../models/job');
const Person = require('../models/person');
const Applicant = require('../models/applicant');
const Application = require('../models/application');
const Company = require('../models/company');

const utils = require('../util/utils');
const sequelize = require('../util/database');
// const { utils } = require('mocha');


exports.apply = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation error, incorrect data');
        error.statusCode = 422;
        error.validationArray = errors.array();
        throw error;
    }

    const jobId = req.params.id;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phone = req.body.phone;
    const email = req.body.email;
    const cvUrl = req.file? req.file.filename : null;

    try {
        // Wrap db functions in transaction callback, passing t to each call option object  
        await sequelize.transaction(async (t) => {
            let hasApplied;

            // Find the relevant job
            const job = await Job.findByPk(jobId, { transaction: t });

            if(!job) {
                const error = new Error(`No Job Found`);
                error.statusCode = 422;
                throw error;
            }

            // See if the person already exists in the DB
            let person = await Person.findOne({
                where: {
                    email: email
                },
                include: {
                    model: Applicant
                }
            }, { transaction: t });

            // If the person exists and has applied for a job
            if(person && person.applicant) {
                console.log("Person exists and is an applicant of a job");
                hasApplied = await Application.findOne({ 
                    where: { jobId: jobId, applicantId: person.applicant.id }
                }, { transaction: t });
            }

            // Throw an error if applied, return their email for the response
            if(!!hasApplied) {
                const error = new Error(`You've already applied to this job`);
                error.email = person.email;
                error.statusCode = 422;
                throw error;
            }

            // If no person exists yet, create them
            if(!person) {
                console.log('no such person exists yet');
                person = await Person.create({ 
                    firstName, 
                    lastName, 
                    email, 
                    phone 
                }, { transaction: t });
            }

            // Make the person an applicant
            // Edge case: There was a person but no related applicant => they're a contact at a different firm, as well as a potential applicant
            if(!person.applicant){
                console.log('an applicant for that person doesnt exist yet');
                person.applicant = await Applicant.create({ cvUrl: cvUrl, personId: person.id }, { transaction: t });
            } else {
                console.log('updating person')
                // Update the applicant 

                // Replace their CV from past applications with the new application CV
                // Edge case: File deleted off of server but in the DB as a URL - will be re-added without crashing
                utils.deleteCv(person.applicant.cvUrl);
                person.applicant.cvUrl = cvUrl;

                person.applicant = await person.applicant.save({ transaction: t });
                person.firstName = firstName;
                person.lastName = lastName;
                person.phone = phone;

                person = await person.save({ transaction: t });
            }

            const application = await Application.create({ jobId: job.id, applicantId: person.applicant.id }, {transaction: t});
   

            res.status(201).json({ msg: 'Application successful', ref: `JRS-03-${application.id}` });

        })
    } catch (err) {
        console.log(err)
        // Transaction rolled back automatically by Sequelize
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
        return err;
    }
} 

// exports.apply = (req, res, next) => {
//     const errors = validationResult(req);
//     if(!errors.isEmpty()) {
//         const error = new Error('Validation error, incorrect data');
//         error.statusCode = 422;
//         error.validationArray = errors.array();
//         throw error;
//     }
//     // if(!req.file) {
//     //     const error = new Error('No cv provided');
//     //     error.statusCode = 422;
//     //     throw error;
//     // }

//     const jobId = req.params.id;
//     const firstName = req.body.firstName;
//     const lastName = req.body.lastName;
//     const phone = req.body.phone;
//     const email = req.body.email;
//     const cvUrl = req.file? req.file.filename : null;

//     let currentPerson;
//     let prevApplicant;
//     let currentApplicant;
//     let currentJob;
    
//     // Find the job
//     Job.findByPk(jobId)
//         .then(job => {
//             if(!job) {
//                 const error = new Error('Error applying: No job found.');
//                 error.statusCode = 404;
//                 throw error;
//             } else {
//                 currentJob = job;
//                 // Check if the Person applying exists already
//                 return Person.findOne({ where: { email: email } });
//             }
//         })
//         .then(person => {
//             // Create a new Person if they don't exist
//             if(!person) return Person.create({ firstName, lastName, email, phone });
//             else return person;
//         })
//         .then(person => {
//             if(!person) {
//                 throw new Error('Error creating application. Please contact us directly');
//             } else {
//                 currentPerson = person;
//                 // Check if they're an applicant
//                 // @TODO: does person.getApplicant(); work in its place?
//                 return Applicant.findOne({where: { personId: person.id }});
//             }
//         })
//         .then(applicant => {
//             // Create an applicant if they don't exist
//             if(!applicant) {
//                 return Applicant.create({ personId: currentPerson.id, cvUrl });
//             } else {
//                 prevApplicant = applicant;
//                 // if(applicant.cvUrl) {
//                 //     // If the file is missing (deleted off the server, but in the url in db), it will re-add without crashing
//                 //     utils.deleteCv(applicant.cvUrl);
//                 //     applicant.cvUrl = cvUrl;
//                 // };

//                 return applicant;
//             }
//         })
//         .then(applicant => {
//             if(!applicant) {
//                 throw new Error('Error creating application. Please contact us directly');
//             } else {
//                 console.log(currentPerson);
//                 if(prevApplicant && prevApplicant.cvUrl) {
//                     // If the file is missing (deleted off the server, but in the url in db), it will re-add without crashing
//                     utils.deleteCv(prevApplicant.cvUrl);
//                     applicant.cvUrl = cvUrl;
//                 };
//                 return applicant.save();
//             }
//         })
//         .then(applicant => {
//             if(!applicant) {
//                 throw new Error('Error creating application. Please contact us directly');
//             } else {
//                 currentApplicant = applicant;
//                 return applicant.hasJob(currentJob);
//                 // console.log(Object.keys(applicant.__proto__));
//             }
//         })
//         .then(hasApplied => {
//             if(hasApplied) {
//                 const error = new Error(`You've already applied to this job`);
//                 error.email = currentPerson.email;
//                 error.statusCode = 422;
//                 throw error;
//             }

//             return currentApplicant.addJob(currentJob);
//         }) 
//         .then(application => {
//             if(!application){
//                 throw new Error('Error creating application. Please contact us directly');
//             } else {
//                 res.status(201).json({ msg: 'Application successful', ref: `JRS-03-${application[0].id}` });
//             }
//         }) 
//         .catch(err => {
//             console.log(err);
//             next(err)
//         });
// };

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
