const fs = require('fs');
const util = require('util');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../util/database');
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

exports.getApplications = async(req, res, next) => {
    const index = req.query.index || 0;
    const limit = req.query.limit || 10;
    // const orderField = req.query.orderField || 'createdAt';
    const order = req.query.orderDirection || 'DESC';

    let orderFields;

    switch(req.query.orderField) {
        case 'lastName': 
            orderFields = [
                ['applicant', 'person', 'lastName'], 
                ['applicant', 'person', 'firstName'], 
                
                // lastName & firstName is not enough to get a unique order.
                // In order to make sure the order is always same and pagination works properly,
                // you should add either order by id or createdAt/updatedAt. 
                ['applicant', 'createdAt', order]

            ];
            break;
        
        default:
            orderFields = [ 'createdAt' ];
        
    }

    console.log(orderFields, order);

    try {
        const applications = await Application.findAndCountAll({
            include: [
                {                               
                    model: Job,
                    include: [ 
                        { 
                            model: Company,
                            attributes: [ 'id', 'name' ]
                        } 
                    ]
                },
                {
                    model: Applicant,
                    include: [ 
                        {
                            model: Person,
                            attributes: [ 'id', 'firstName', 'lastName', 'email', 'phone', 'createdAt' ]
                        } 
                    ],
                }
            ],

            subQuery: false,
            // order: [
            //     ['applicant', 'person', 'lastName'], 
            //     ['applicant', 'person', 'firstName'], 
                
            //     // lastName & firstName is not enough to get a unique order.
            //     // In order to make sure the order is always same and pagination works properly,
            //     // you should add either order by id or createdAt/updatedAt. 
            //     ['applicant', 'createdAt', 'desc']

            // ],    
            order: orderFields,      
            limit: parseInt(limit, 10), 
            offset: parseInt(index),
            attributes: [ 
                'id',
                'applicantId',
                'jobId',
                [Sequelize.fn('date_format', Sequelize.col('application.createdAt' ), '%d/%m/%y'), 'applicationDate']
 
            ]
        });

        res.status(200).json({msg: 'success', applications: applications});

    } catch (err) {
        console.log(err);
    }

}

// exports.getApplications = async (req, res, next) => {
//     const index = req.query.index || 0;
//     const limit = req.query.limit || 10;
//     const orderField = req.query.orderField || 'createdAt';
//     const order = req.query.orderDirection || 'DESC';

//     const { rows, count } = await Application.findAndCountAll({ 
//         limit: parseInt(limit, 10), 
//         offset: parseInt(index), 
//         order: [[orderField, order]],
//         distinct: true 
//     });
//     let results = [];

//     try {
//         await Promise.all(rows.map(async (application) => {
//             const job = await Job.findOne({ where: { id: application.jobId }, include: { model: Company } });
//             const applicant = await Applicant.findOne({ where: { id: application.applicantId }, include: { model: Person } });
//             results.push({ 
//                 applicationId: application.id,
//                 companyId: job.companyId,
//                 company: job.company.name,
//                 jobId: job.id,
//                 position: job.title,
//                 applicantId: applicant.id,
//                 personId: applicant.person.id,
//                 firstName: applicant.person.firstName,
//                 lastName: applicant.person.lastName,
//                 email: applicant.person.email,
//                 phone: applicant.person.phone,
//                 cvUrl: applicant.cvUrl
//             });
//         }));
//         res.status(200).json({msg: 'success', applications: results, total: count});

//     } catch(err) {
//         console.log(err);
//     }
// }

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
        distinct: true,
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
            'jobType',
            'position',
            'pqe',
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
                id, title, wage, location, description, featured, jobDate, companyId, jobType, position, pqe,
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
                jobType,
                position,
                pqe,
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

exports.editJob = async (req, res, next) => {


    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            const error = new Error();
            error.message = 'Validation Error';
            error.statusCode = 422;
            error.validationErrors = errors.array({ onlyFirstError: true });
            throw (error);
        }
    
        const job = await Job.findOne({
            where: { id: req.params.id },
            include: Company 
        });

        if(!job) {
            const err = new Error('Error editing Job');
            err.statusCode = 422;
            throw err;
        }

        job.title = req.body.title;
        job.wage = req.body.wage;
        job.location = req.body.location;
        job.description = req.body.description;
        job.featured = req.body.featured;
        job.companyId = req.body.companyId;
        job.jobType = req.body.jobType;
        job.position = req.body.position;
        job.pqe = parseInt(req.body.pqe);


        await job.save();

        res.status(200).json({ message: 'Job edited', job: job });


    } catch(err) {
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }

    // return Job.findOne({
    //     where: { id: req.params.id },
    //     include: Company 
    // })
    // .then(job => {
    //     if(!job) {
    //         const error = new Error('Job not found');
    //         error.statusCode = 422;
    //         throw error;
    //     }
    //     job.title = req.body.title;
    //     job.wage = req.body.wage;
    //     job.location = req.body.location;
    //     job.description = req.body.description;
    //     job.featured = req.body.featured;
    //     job.companyId = req.body.companyId;
    //     job.jobType = req.body.jobType;
    //     job.position = req.body.position;
    //     job.pqe = req.body.pqe;
    //     console.log(job.title);
    //     console.log("HELLO");
    //     console.log(job.title, job.wage, job.location, job.description, job.featured);

    //     console.log(job.dataValues);
    //     return job.save();
    // })
    // .then(job => {
    //     console.log('test');
    //     if(!job) {
    //         const error = new Error('Error editing the job');
    //         error.statusCode = 422;
    //         throw error;
    //     }

    //     res.status(200).json({ message: 'Job edited', job: job });
    //     return;
    // })
    // .catch(err => {
    //     if(!err.statusCode) err.statusCode = 501;
    //     next(err);
    //     return err;
    // });
};

exports.createJob = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        console.log('Validation Error');
        const error = new Error('Validation Error');
        error.validationErrors = errors.array({ onlyFirstError: true });
        error.statusCode = 422;
        throw error;
    }
    console.log('success');

    // Check to see if a related company exists
    const job = Company.findByPk(req.body.companyId).then(result => {
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
            jobType: req.body.jobType,
            position: req.body.position,
            pqe: parseInt(req.body.pqe),
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
        console.log(err);
        next(err);
        return err;
    });

    return job;
};

exports.getJob = (req, res, next) => {
    return Job.findByPk(req.params.id)
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

    // findAndCountAll returns Promise<{ count: number, rows: Model[] }>
    return Company.findAndCountAll({
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
            { model: Job }, 
            { model: Address },
            { model: Person }
        ]
    }).then(results => {
        results.rows = results.rows.map((
            { 
                dataValues: { id, name, companyDate, addresses, people }
        }) => { 
            people = people.map(({ firstName, lastName, id: personId, email, phone, contact: { position, id: contactId } }) =>  { 
                return { personId, firstName, lastName, email, phone, position, contactId };
            });
        
            addresses = addresses.map(( { 
                dataValues: { id: addressId, firstLine, secondLine, city, county, postcode }
            }) => { 
                return { addressId, firstLine, secondLine, city, county, postcode }
            });

            return { id, name, companyDate, addresses, people }; 
        });

        res.status(200).json({ companies: results.rows, total: results.count });
        return;
    }).catch(err => {
        if(!err.statusCode) err.statusCode = 500; 
        next(err);
        return err;
    });
};

exports.getCompany = (req, res, next) => {

    // Returns Promise<Model || null>
    return Company.findByPk(req.params.id, { 
        include: Address
    }).then(company => {
        if(!company) {
            const error = new Error('Could not find the company');
            error.statusCode = 422;
            throw error;
        }

        res.status(200).json({ msg: 'Company found', company });
        return company;
    }) 
    .catch(err => {
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    });
};


exports.createCompany = async(req, res, next) => {

    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const error = new Error('Validation Error');
            error.validationErrors = errors.array({ onlyFirstError: true });
            error.statusCode = 422;
            throw error;
        }

        // Wrap db functions in transaction callback, passing t to each call option object
        await sequelize.transaction(async (t) => {

            // Returns Promise<Model>
            const company = await Company.create({ name: req.body.companyName }, { transaction: t });

            if(!company) { const err = new Error('Error creating Company'); throw err; }

            // Returns Promise<Model>
            const person = await Person.create({ 
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone,
                email: req.body.email
            }, { transaction: t });

            if(!person) { const err = new Error('Error creating Person'); throw err; }

            // Returns Promise<Model>
            const address = await Address.create({
                firstLine: req.body.firstLine,
                secondLine: req.body.secondLine,
                city: req.body.city,
                county: req.body.county,
                postcode: req.body.postcode
            }, { transaction: t });

            if(!address) { const err = new Error('Error creating Address'); throw err; }

            await company.addPeople(person, { through: { position: req.body.position }, transaction: t});
            await company.addAddresses(address, { transaction: t });

            res.status(201).json({ msg: 'Success', company: company });
        
            return;
        });
    
      // Transaction committed successfully
      // `result` is whatever was returned from the transaction callback
    } catch (err) {
        // Transaction rolled back automatically by Sequelize
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
        return err;
    }
};
    
exports.deleteCompany =  (req, res, next) => {
    let company;

    return sequelize.transaction(function(t) {
        return (
            Company
                .findByPk(req.params.id, { transaction: t })
                .then(result => {
                    if(!result) {
                        const error = new Error('Cannot find Company');
                        error.statusCode = 422;
                        throw error;
                    }
                    company = result;
                    // Returns Promise<[Person]>
                    return company.getPeople({transaction: t});
                })
                .then(people => {
                    if(people.length < 1) {
                        const error = new Error('Error deleting contacts. Please contact admininstrator');
                        error.statusCode = 500;
                        throw error;
                    }
                    const ids = people.map(person => person.dataValues.id);

                    return Person.destroy({ where: { id: ids }, transaction: t });
                }).then(result => {
                    if(!result) {
                        const error = new Error('Error deleting contacts');
                        error.statusCode = 500;
                        throw error;
                    }
                    return company.getJobs({ transaction: t });
                }).then(jobs => {
                    if(!jobs) {
                        const error = new Error('Error deleting jobs');
                        error.statusCode = 500;
                        throw error;
                    }
                    const ids = jobs.map(job => job.dataValues.id);

                    if(jobs.length === 0) return jobs;
                    // NB: Destroying the job destroys the applications
                    else return Job.destroy({ where: { id: ids }, transaction: t });
                    
                }).then(result => {
                    if(!result) {
                        const error = new Error('Error deleting jobs');
                        error.statusCode = 500;
                        throw error;
                    }
                    return company.getAddresses({ transaction: t });
                }).then(addresses => {
                    if(!addresses) {
                        const error = new Error('Error deleting addresses');
                        error.statusCode = 500;
                        throw error;
                    }
                    console.log(`Addresses: ${JSON.stringify(addresses)}`);
                    const ids = addresses.map(address => address.dataValues.id);

                    if(addresses.length === 0) return addresses;
                    else return Address.destroy({ where: { id: ids }, transaction: t });

                }).then(result => {
                    if(!result) {
                        const error = new Error('Error deleting addresses');
                        error.statusCode = 500;
                        throw error;
                    }
                    return company.destroy({transaction: t});
                })
        )
    }).then(result => {
        if(!result) {
            const error = new Error('Error deleting job');
            error.statusCode = 500;
            throw error;
        }
        res.status(200).json({msg: 'Company Deleted'});
        return;
    }).catch(err => {
        if(!err.statusCode) err.statusCode = 500; 
        next(err);
        return err;
    });;


};

exports.editCompany = async (req, res, next) => {

    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            const error = new Error('Validation Error');
            error.validationErrors = errors.errors;
            error.statusCode = 422;
            throw error;
        }

        if((!req.params.contactId && parseInt(req.params.contactId) !== 0) || (!req.params.addressId && parseInt(req.params.addressId) !== 0 )) {
            const error = new Error('Error editing Company');
            error.statusCode = 400;
            throw error;
        }

        await sequelize.transaction(async(t) => {
            const company = await Company.findByPk(req.params.id, {
                include: [
                    { model: Address },
                    { model: Person },
                ]
            });

            if(!company) {
                const err = new Error('Company not found');
                err.statusCode = 422;
                throw err;
            }

            // Check if there's an array of people
            if(company.people.length === 0 || !company.people ) throw new Error('Error editing Company1');

            // Check if a valid contact ID has been provided
            const person = company.people.find(person => person.id === parseInt(req.params.contactId));
            console.log(company.people[0].id, req.params.contactId);

            if(!person) {
                const error = new Error('Error editing Company2');
                error.statusCode = 422;
                throw error;
            }

            // Check if there's an array of addresses
            if(company.addresses.length === 0 || !company.addresses) throw new Error('Error editing Company3');

            // Check if a valid address ID has been provided
            const address = company.addresses.find(address => address.id === parseInt(req.params.addressId))
            if(!address) {
                const error = new Error('Error editing Company4');
                error.statusCode = 422;
                throw error;
            }

            const personIndex = company.people.indexOf(person);
            const addressIndex = company.addresses.indexOf(address);

            company.name = req.body.companyName;
            company.people[personIndex].firstName = req.body.firstName;
            company.people[personIndex].lastName = req.body.lastName;
            company.people[personIndex].contact.position = req.body.position;
            company.people[personIndex].phone = req.body.phone;
   
            if((req.body.email !== company.people[personIndex].email)) company.people[personIndex].email = req.body.email;
            company.addresses[addressIndex].firstLine = req.body.firstLine;
            company.addresses[addressIndex].secondLine = req.body.secondLine;
            company.addresses[addressIndex].city = req.body.city;
            company.addresses[addressIndex].county = req.body.county;
            company.addresses[addressIndex].postcode = req.body.postcode;

            await company.save();
            await company.people[personIndex].save();
            await company.people[personIndex].contact.save();
            await company.addresses[addressIndex].save();

            res.status(200).json({ msg: 'Company successfully updated', company });
        });

        return;
    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }

};  