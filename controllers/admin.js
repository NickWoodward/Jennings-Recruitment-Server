const fs = require('fs');
const util = require('util');
const path = require('path');
const Sequelize = require('sequelize');
const { validationResult } = require('express-validator');

const Address = require('../models/address');
const Application = require('../models/application');
const Applicant = require('../models/applicant');
const Contact = require('../models/contacts');
const Person = require('../models/person');
const Job = require('../models/job');
const Company = require('../models/company');

// View magic methods 
// console.log(Object.keys(obj.__proto__));

//@TODO: validation
exports.createApplicant = (req, res, next) => {
    // const errors = validationResult(req);
    // console.log(errors);
    // if(!errors.isEmpty()) {
    //     console.log(errors);
    //     const error = new Error('Validation Error');
    //     error.statusCode = 422;
    //     throw error;
    // }
    const { firstName, lastName, phone, email } = req.body;
    const cvUrl = req.file? req.file.filename: null;
    let persistPerson;

    Person.create({
       firstName,
       lastName,
       phone,
       email
    }).then(person => {
        if(!person) {
            const error = new Error('New applicant could not be created');
            error.statusCode = 422;
            throw error;
        }
        persistPerson = person;
        return Applicant.create({ cvUrl, personId: person.dataValues.id });
    }).then(applicant => {
        if(!applicant) {
            const error = new Error('New applicant could not be created');
            error.statusCode = 422;
            throw error;
        }
        const { firstName, lastName, email, phone } = persistPerson;
        const { id: applicantId } = applicant;
        const cvName = cvUrl || null;
        const cvType = cvName? cvName.slice(cvName.lastIndexOf('.')):null;

        const person = {
            applicantId,
            firstName,
            lastName,
            email,
            phone,
            cvName,
            cvType,
        }

        res.status(201).json({ msg: "Success", user: person });
    }).catch(err => next(err));
};

exports.deleteApplicant = (req, res, next) => {
    Applicant.findOne({
        where: { id: req.params.id },
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
    console.log(`Request: ${req.params.id}`);

    Applicant.findOne({
        where: { id: req.params.id },
        include: Person
    }).then(applicant => {
            if(!applicant) { 
                const error = new Error();
                error.message = 'No User Found';
                error.statusCode = 404;
                next(error);
            }
            console.log(`Applicant found, applicantId: ${applicant.id}, personId: ${applicant.personId}`);
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

            console.log(`Person: AppId:${applicant.id}, PersonId: ${person.id}`);
                    
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
    const orderField = req.query.orderField || 'createdAt';
    const order = req.query.orderDirection || 'DESC';

    Applicant.findAndCountAll({
        limit: parseInt(limit, 10),
        offset: parseInt(index),
        order: [[orderField, order]],
        attributes: [
            'id',
            'cvUrl',
            'createdAt',
            [Sequelize.fn('date_format', Sequelize.col('applicant.createdAt' ), '%d/%m/%y'), 'userDate']
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
                    dataValues: {    
                        id:applicantId, 
                        userDate, 
                        jobs,
                        person: { firstName, lastName, phone, email },
                        cvUrl
                    }
                }) => {
                    const cvType = cvUrl? cvUrl.slice(cvUrl.lastIndexOf('.')):null;
                    const cvName = cvUrl? cvUrl.slice(12): 'No CV uploaded';
                    // Format jobs array
                    jobs = jobs.map(({ id:jobId, title, location, company: { id:companyId, name: companyName } }) => {
                        return { jobId, title, location, companyId, companyName };
                    });
                    // Format containing applicant
                    return { applicantId, firstName, lastName, phone, email, cvType, cvName, userDate, jobs };
                });
                
                console.log('Applicants: ' + applicants.count);

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
    const index = req.query.index || 0;
    const limit = req.query.limit || 10;
    const orderField = req.query.orderField || 'createdAt';
    const order = req.query.orderDirection || 'DESC';

    const findJobs = Job.findAndCountAll({
        attributes: [
            'id',
            'title',
            'wage',
            'location',
            'description',
            'featured',
            'createdAt',
            [Sequelize.fn('date_format', Sequelize.col('job.createdAt'), '%d/%m/%y'), 'jobDate'],
            'companyId'
        ],
        offset: parseInt(index),
        limit: parseInt(limit, 10),
        order: [ [orderField, order] ],
        distinct: true,
        include: [ 
            {
                model: Company,
                attributes: ['name']
            }, 
            {
                model: Applicant,
                attributes: [
                    'id', 
                    'cvUrl', 
                    'personId',
                    [Sequelize.fn('date_format', Sequelize.col('applicants.createdAt'), '%d/%m/%y'), 'createdAt'],
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
    .then(results => {
        results.rows = results.rows.map(({
            dataValues: {
                id, title, wage, location, description, featured, jobDate, companyId,
                company: { name: companyName },
                applicants,
            }
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
                applicants
             };
        });

        res.status(200).json({ msg: 'Success', jobs: results.rows, total: results.count });
        return;
    })
    .catch(err => {
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    });

    return findJobs;

};

// @TODO: add validation
// @TODO: Check that other control methods follow this format for error handling
exports.editJob = (req, res, next) => {
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
            const error = new Error('Job not found');
            error.statusCode = 422;
            throw error;
        }
        job.title = req.body.title;
        job.wage = req.body.wage;
        job.location = req.body.location;
        job.description = req.body.description;
        job.featured = req.body.featured;
        job.companyId = req.body.companyId;

        return job.save();
    })
    .then(company => {
        res.status(200).json({ message: 'Job edited' });
    })
    .catch(err => next(err));
};

// @TODO: add validation
exports.createJob = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation Error');
        error.validationErrors = errors.errors;
        error.statusCode = 422;
        throw error;
    }

    // Check to see if a related company exists
    const job = Company.findByPk(req.body.companyId).then(result => {
        // Company.count().then(total => console.log(total));
        if(!result) {
            const error = new Error('No such Company exists');
            error.statusCode = 404;
            throw error;
        }
        return Job.create({
            companyId: req.body.companyId,
            title: req.body.title,
            wage: req.body.wage,
            location: req.body.location,
            description: req.body.description,
            featured: req.body.featured
        })
    }).then(job => {
        if(!job) {
            const error = new Error('Could not create the job');
            error.statusCode = 422;
            throw error;
        }
        res.status(201).json({ message: 'Job created', job: job });
        return;
    }).catch(err => {
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    });

    return job;
};

exports.getJob = (req, res, next) => {
    return Job
        .findByPk(req.params.id)
        .then(job => {
            if(!job) {
                const error = new Error('No job found');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ message: 'Job found', job });
            return;
        })
        .catch(err => {
            if(!err.statusCode) err.statusCode = 500;
            next(err);
            return err;
        });
};

exports.deleteJob = (req, res, next) => {
    return Job.findByPk(req.params.id)
        .then(job => {
            if(!job) {
                const error = new Error('No job found');
                error.statusCode = 422;
                throw error;
            }

            return job.destroy();
        }).then(result => {
            if(!result) {
                const error = new Error('Error deleting job');
                error.statusCode = 500;
                throw error;
            }
            res.status(200).json({message: 'Job deleted'});
            return;
        }).catch(err => {
            if(!err.statusCode) err.statusCode = 500;
            next(err);
            return err;
        });
};

exports.getCompanies = (req, res, next) => {
    const index = req.query.index || 0;
    const orderField = req.query.orderField || 'createdAt';
    const order = req.query.orderDirection || 'DESC';

    const constraints = {
        offset: parseInt(index),
        order: [[ orderField, order ]]
    };

    if(req.query.limit) constraints.limit = parseInt(req.query.limit);

    Company.findAndCountAll({
        attributes: [ 
            'id', 
            'name',
            'createdAt',
            [Sequelize.fn('date_format', Sequelize.col('company.createdAt' ), '%d/%m/%y'), 'companyDate'],
        ],
        // group: ['name'],
        ...constraints,
        distinct: true,
        include: [
            {
                model: Job
            }, 
            {
                model: Address
            },
            {
                model: Person
            }
        ]
            
    }).then(results => {
        results.rows = results.rows.map(({ 
                dataValues: { 
                    id, 
                    name, 
                    companyDate, 
                    addresses, 
                    people,
                } 
        }) => { 

            people = people.map(({ firstName, lastName, id: personId, email, phone, contact: { position, id: contactId } }) =>  { 
                return { personId, firstName, lastName, email, phone, position, contactId };
            });
            return { id, name, companyDate, addresses, people }; 
        });

        res.status(200).json({ companies: results.rows, total: results.count });
    }).catch(err => {
        throw err;
    });
};

exports.createCompany = (req, res, next) => {
    const errors = validationResult(req);
    
    if(!errors.isEmpty()) {
        const error = new Error('Validation Error');
        error.statusCode = 422;
        throw error;
    }

    let persistCompany;
    let persistPerson;
    let persistAddress;

    Company.create({
        name: req.body.companyName
    }).then(company => {
        persistCompany = company;

        return Person.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,
            email: req.body.email
        });
    }).then(person => {
        persistPerson = person;

        return Address.create({
            firstLine: req.body.firstLine,
            secondLine: req.body.secondLine,
            city: req.body.city,
            county: req.body.county,
            postcode: req.body.postcode
        });
    }).then(address => {
        persistAddress = address;

        return persistCompany.addPeople(persistPerson, { through: { position: req.body.position } });
    }).then(result => {
        return persistCompany.addAddresses(persistAddress);
    }).then(result => {
        res.status(201).json({ msg: 'Success', company: persistCompany });
    }).catch(err => next(err));


    // Company.create({
    //     name: req.body.companyName,
    //     people: [ 
    //         {
    //             firstName: req.body.firstName,
    //             lastName: req.body.lastName,
    //             phone: req.body.phone,
    //             email: req.body.email,
    //             contact: {
    //                 position: req.body.position
    //             }
    //         }
    //     ],
    //     // address: [
    //     //     {
    //     //         firstLine: req.body.firstLine,
    //     //         secondLine: req.body.secondLine,
    //     //         city: req.body.city,
    //     //         county: req.body.county,
    //     //         postcode: req.body.postcode,
    //     //         companyAddress: { }
    //     //     }
    //     // ]
    // }, {
    //     include: Person
    // }).then(result => {
    //     console.log(result);
    //     res.status(200).json({ msg: 'Success', result });
    // }).catch(err => next(err));
};

exports.deleteCompany = (req, res, next) => {
        let company;

        Company.findByPk(req.params.id)
                .then(result => {
                    if(!result) {
                        const error = new Error('Cannot find Company');
                        error.statusCode = 404;
                        throw error;
                    }
                    company = result;
                    return company.getPeople();

                })
                .then(people => {
                    if(!people) {
                        const error = new Error('Error deleting contacts');
                        error.statusCode = 500;
                        throw error;
                    }
                    console.log(`People: ${people}, ${!people}`);
                    const ids = people.map(person => person.dataValues.id);

                    // If people is an empty array, just return it, else destroy the records
                    if(people.length === 0) return people;
                    else return Person.destroy({ where: { id: ids } });

                }).then(result => {
                    if(!result) {
                        const error = new Error('Error deleting contacts');
                        error.statusCode = 500;
                        throw error;
                    }
                    return company.getJobs();
                }).then(jobs => {
                    if(!jobs) {
                        const error = new Error('Error deleting jobs');
                        error.statusCode = 500;
                        throw error;
                    }
                    console.log(`Jobs: ${jobs}`);
                    const ids = jobs.map(job => job.dataValues.id);

                    if(jobs.length === 0) return jobs;
                    // NB: Destroying the job destroys the applications
                    else return Job.destroy({ where: { id: ids } });
                    
                }).then(result => {
                    if(!result) {
                        const error = new Error('Error deleting jobs');
                        error.statusCode = 500;
                        throw error;
                    }
                    return company.getAddresses();
                }).then(addresses => {
                    if(!addresses) {
                        const error = new Error('Error deleting addresses');
                        error.statusCode = 500;
                        throw error;
                    }
                    const ids = addresses.map(address => address.dataValues.id);

                    if(addresses.length === 0) return addresses;
                    else return Address.destroy({ where: { id: ids } });

                }).then(result => {
                    if(!result) {
                        const error = new Error('Error deleting addresses');
                        error.statusCode = 500;
                        throw error;
                    }
                    return company.destroy();

                }).then(result => {
                    if(!result) {
                        const error = new Error('Error deleting job');
                        error.statusCode = 500;
                        throw error;
                    }
                    res.status(200).json({msg: 'Company Deleted'});
                }).catch(err => next(err));
};