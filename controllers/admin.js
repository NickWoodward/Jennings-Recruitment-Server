const fs = require('fs');
const utils = require('../util/utils');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const {Op} = require('sequelize');
const { validationResult } = require('express-validator');

const Address = require('../models/address');
const Application = require('../models/application');
const Applicant = require('../models/applicant');
const Contact = require('../models/contact');
const Person = require('../models/person');
const Job = require('../models/job');
const Company = require('../models/company');


exports.getApplications = async(req, res, next) => {
    const findOne = req.query.indexId;
    const searchTerm = req.query.searchTerm;
    const index = req.query.index || 0;
    let limit = req.query.limit || 10;
    const orderField = req.query.orderField || 'id';
    const orderDirection = req.query.orderDirection || 'DESC';
    let order;
    let topRows = [];

    console.log('*********', orderField, orderDirection, {searchTerm});
    console.log({limit}, {index});
    switch(req.query.orderField) {
        // case 'lastName': 
        //     order = [
        //         ['applicant', 'person', 'lastName'], 
        //         ['applicant', 'person', 'firstName'], 
                
        //         // lastName & firstName is not enough to get a unique order.
        //         // In order to make sure the order is always same and pagination works properly,
        //         // you should add either order by id or createdAt/updatedAt. 
        //         ['applicant', 'createdAt', orderDirection]

        //     ];
        //     break;
        case 'name': {
            order = [ 
                Applicant, Person, 'firstName', orderDirection
            ];
            break;
        }
        case 'surname': {
            order = [
                [Applicant, Person, 'lastName', orderDirection],
                // [Applicant, Person, 'firstName', 'ASC'],
                // [Applicant, Person, 'id', 'ASC']
            ];
            break;
        }
        case 'title': {
            order = [
                // [Applicant, Person, 'lastName', 'ASC'],
                [Job, 'title', orderDirection],
            ];
            break;
        }
        case 'company': {
            order = [
                Job, Company, 'name', orderDirection
            ]
            break;
        }
        case 'cv': {
            order = [
                [Sequelize.fn('isnull', Sequelize.col('cvUrl')), orderDirection]
            ];
            break;
        }
        default:
            order = [ orderField, orderDirection ];
        
    }

    const attributes = [ 
        'id',
        'applicantId',
        'jobId',
        [Sequelize.fn('date_format', Sequelize.col('application.createdAt' ), '%d/%m/%y'), 'applicationDate']
    ];

    const included = [
        {                               
            model: Job,
            as: 'job',
            include: [ 
                { 
                    model: Company,
                    as: 'company',
                    attributes: [ 'id', 'name' ],
                    include: [
                      {
                        model: Contact,
                        separate: true,
                        include: [{
                          model: Person,
                          attributes: [ 'firstName', 'lastName', 'phone', 'email' ]
                        }]
                      }
                    ]
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
    ];

    // Search Options
    const topRowOptions = {
        attributes,
        include: included
    };
    const options = {
        include: included,
        order: [order],      
        distinct: true,
        attributes
    }
    if(req.query.limit) options.limit = parseInt(limit, 10);
    if(req.query.index) options.offset = parseInt(index, 10);

    try {
        // Find a specific row to highlight if needed
        if(findOne) {
            const row = await Application.findByPk(findOne, topRowOptions);
            topRows = [row];
        }
        
        if(searchTerm) {
            // topRowOptions.include[0].include[0].where = { name: { [Op.like]: `%${searchTerm}%` } };
            topRowOptions.where = {'$job.company.name$': { [Op.like]: `%${searchTerm}%` }}
            
            const rows = await Application.findAll(topRowOptions)
            topRows = rows;
        }

        const applications = await Application.findAndCountAll(options);

        // If there's a row to be highlighted
        if(topRows.length > 0) {
            const test = topRows.map(row => row.toJSON())
            console.log(test, test.length);

            topRows.forEach(row => {
                const visible = applications.rows.filter(application => application.id === row.id)[0];
                const index = applications.rows.findIndex(application => application.id === row.id);
    
                // 1 too many applications in the array
                if(applications.rows.length + topRows.length > limit) {
                    // If the row appears in the array to be returned, remove it
                    if(visible) {
                        console.log('VISIBLE + LIMIT REACHED => SPLICE:  ', visible.id);
                        console.log(index);
                        applications.rows.splice(index, 1);
    
                    } else {
                        console.log('NOT VISIBLE + LIMIT REACHED => POP');
                        console.log(index);
                        // Remove the last element instead
                        applications.rows.pop();
                    }
                } else { 
                    if(visible) {
                        console.log('VISIBLE + LIMIT NOT REACHED REACHED', visible.title);
                        console.log(index);
    
                        applications.rows.splice(index, 1);
                    } else {
                        // do nothing
                        console.log('NOT VISIBLE + LIMIT NOT REACHED', visible);
                        console.log(index);
    
                    }
                }
                
                // Add the highlighted topRow to the array
                applications.rows.unshift(row) 
            })
        }

        //     const visible = applications.rows.filter(application => application.id === topRow.id)[0];
        //     const index = applications.rows.findIndex(application => application.id === topRow.id);


        //     // 1 too many results in the array
        //     if(applications.rows.length + 1 > limit) {
        //         // If the row appears in the array to be returned, remove it
        //         if(visible) {
        //             applications.rows.splice(index, 1);
        //         } else {
        //             // Remove the last element instead
        //             applications.rows.pop();
        //         }
        //     } else { 
        //         if(visible) {applications.rows.splice(index, 1); }
        //     }
            
        //     // Add the highlighted topRow to the array
        //     applications.rows.unshift(topRow) 
        // }
        applications.rows.forEach(row => console.log(row.job.toJSON()))
        console.log(applications.rows.length)
        res.status(200).json({msg: 'success', applications: applications});

    } catch (err) {
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        console.log(err);
    }

};


exports.createApplication = async(req, res, next) => {
    const jobId = req.params.jobId;
    const applicantId = req.params.personId;

    if(!jobId || !applicantId){
        const error = new Error('No ID found');
        error.statusCode = 422;
        throw error;
    }

    try {
        // Check if the application has already been made
        const application = await Application.findAll({ 
            where: {
                applicantId: applicantId,
                jobId: jobId
            } 
        });

        if(application.length > 0) {

            const error = new Error('Application already made');
            error.statusCode = 422;
            error.applicationId = application[0].id;
            throw error;        
        }

        const job = await Job.findByPk(jobId);
        const applicant = await Applicant.findByPk(applicantId);

        if(!job || !applicant) {
            const error = new Error('No Job or Applicant found');
            error.statusCode = 422;
            throw error;
        }

        await job.addApplicant(applicant);

        const result = await Application.findOne({ 
            where: { [Op.and]: [{jobId: jobId},{applicantId: applicantId} ] }, 
            attributes: [ 
                'id',
                'applicantId',
                'jobId',
                [Sequelize.fn('date_format', Sequelize.col('application.createdAt' ), '%d/%m/%y'), 'applicationDate']
 
            ],
            include: [
                {                               
                    model: Job,
                    include: [ 
                        { 
                            model: Company,
                            attributes: [ 'id', 'name' ],
                            include: [
                              {
                                model: Contact,
                                separate: true,
                                include: [{
                                  model: Person,
                                  attributes: [ 'firstName', 'lastName', 'phone', 'email' ]
                                }]
                              }
                            ]
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
        })
        res.status(201).json({ application: result, msg: 'success!' });

    } catch(err) {
        console.log(err);
        next(err);
    }
};

exports.deleteApplication = async(req, res, next) => {
    const applicationId = req.params.id;
    let cvUrl;

    try {
        const application = await Application.findByPk(applicationId, {
            include: Applicant
        });
        if(!application) {
            const error = new Error();
            error.message = 'No Application Found';
            error.statusCode = 422;
            
            throw(error);
        }

        cvUrl = application.applicant.cvUrl;
        
        if(cvUrl) {
            utils.deleteCv(cvUrl);
        }

        await application.destroy();
    } catch(err) {
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }

    res.status(200).json({msg: 'success'});
};

//@TODO: validation
exports.createApplicant = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors);
        const error = new Error('Validation Error');
        error.statusCode = 422;
        throw error;
    }
    const { firstName, lastName, phone, email } = req.body;
    let cvUrl = req.file? req.file.filename: null;
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


        const person = {
            applicantId,
            firstName,
            lastName,
            email,
            phone,
            // cvName,
            // cvType,
        }
  
        res.status(201).json({ msg: "Success", user: person });
    }).catch(err => { console.log(err); next(err)});
};

exports.deleteApplicant = (req, res, next) => {
    let cvUrl;

    Applicant.findOne({
        where: { id: req.params.id },
        include: Person
    }).then(applicant => {
        //@TODO: think this is wrong - throw the error, not next
        if(!applicant) {
            const error = new Error();
            error.message = 'No User Found';
            error.statusCode = 404;
            next(error);
        }
        cvUrl = applicant.cvUrl;
        console.log(cvUrl);
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

exports.getApplicants = async (req, res, next) => {
    const findOne = req.query.indexId;
    const index = req.query.index || 0;
    const limit = req.query.limit || 10;
    const orderField = req.query.orderField || 'id';
    const orderDirection = req.query.orderDirection || 'DESC';
    let order;
    let topRow;

    try {
        if(index < 0 || limit < 1) throw new Error();

        // Set Ordering
        switch(req.query.orderField) {
            // Add other cases (see getApplications)
            default:{ 
                order = [orderField, orderDirection];
            }
        }

        // Set the attributes for both the single highlight row and the returned rows
        const applicantAttributes = [
            'id',
            'cvUrl',
            'createdAt',
            [Sequelize.fn('date_format', Sequelize.col('applicant.createdAt' ), '%d/%m/%y'), 'userDate']
        ];
        const personAttributes = [ 'id', 'firstName', 'lastName', 'phone', 'email' ];
        const jobAttributes = [ 
            'id', 
            'title', 
            'location',
            'wage',
            'jobType',
            'pqe',
            [Sequelize.fn('date_format', Sequelize.col('jobs.createdAt' ), '%d/%m/%y'), 'jobDate']
        ];
        const companyAttributes = [ 'id', 'name' ];
        const included = [
            {
                model: Person,
                attributes: personAttributes,
                include: Address 
            },
            {
                model: Job,
                attributes: jobAttributes,
                include: [
                    {
                        model: Company,
                        attributes: companyAttributes
                    }
                ]
            }

        ];


        // Find the specific row to highlight if indexId provided
        if(findOne) {
            topRow = await Applicant.findByPk(findOne, {
                attributes: applicantAttributes,
                include: included
            });

            // Format the top row
            topRow = formatApplicants([topRow])[0];
        }

        const options = {
            attributes: applicantAttributes,
            include: included,
            order: [order],
            distinct: true, 
        }

        if(req.query.limit) options.limit = parseInt(limit, 10);
        if(req.query.index) options.offset = parseInt(index, 10);

        const results = await Applicant.findAndCountAll(options);
        results.rows = formatApplicants(results.rows);

       // If there's a row to be highlighted
       if(topRow) {
        const visible = results.rows.filter(applicant => applicant.id === topRow.id)[0];
        const index = results.rows.findIndex(applicant => applicant.id === topRow.id);
        // 1 too many results in the array
        if(results.rows.length + 1 > limit) {
            // If the row appears in the array to be returned, remove it
            if(visible) {
                console.log('VISIBLE + LIMIT REACHED => SPLICE:  ', {visible});
                results.rows.splice(index, 1);

            } else {
                console.log('NOT VISIBLE + LIMIT REACHED => POP', {visible});
                console.log(index);

                // Remove the last element instead
                results.rows.pop();
            }
        } else { 
            if(visible) {
                console.log('VISIBLE + LIMIT NOT REACHED REACHED',{visible});
                console.log(index);

                results.rows.splice(index, 1);
            } else {
                console.log('NOT VISIBLE + LIMIT NOT REACHED', {visible});
                console.log(index);

            }

        }
        
        // Add the highlighted topRow to the array
        results.rows.unshift(topRow) 
    }
        res.status(200).json({ applicants: results.rows, applicantTotal: results.count });

    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }

}

const formatApplicants = (applicants) => {
    const result = applicants.map(({
        dataValues: { id, userDate, cvUrl, jobs, person: { id: personId, firstName, lastName, phone, email, addresses } }
    }) => {
        // const cvType = cvUrl? cvUrl.slice(cvUrl.lastIndexOf('.')):null;
        // const cvName = cvUrl? cvUrl.slice(12): 'No CV uploaded';
        const cvName = cvUrl;

        let cvType = null;
        // If there's a cvName && the name has a '.' in it, extract the extention
        if(cvName && cvName.lastIndexOf('.') !== -1) {
            cvType = cvName.slice(cvName.lastIndexOf('.'));
        }
        // Format jobs array
        jobs = jobs.map(( {dataValues: { id:jobId, title, location, wage, jobType, pqe, jobDate, company: { id:companyId, name: companyName } }}) => {
            return { jobId, title, location, wage, jobType, pqe, jobDate, companyId, companyName };
        });
        // Format containing applicant
        return { id, personId, firstName, lastName, phone, email, cvType, cvName, userDate, jobs, addresses };
    });

    return result;
}

exports.getApplicantNames = async (req, res, next) => {
    try {
        let applicants = await Applicant.findAll({
            attributes: ['id'],
            include: [
                {
                    model:Person,
                    attributes: ['firstName', 'lastName']
                }
            ],
        });

        applicants = applicants.map(({ id, person: { firstName, lastName } }) => {
            return { applicantId: id, firstName, lastName }
        });

        res.status(200).json({ applicants });
    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return;
    }
};

exports.getCv = (req, res, next) => {
    console.log(req.params);
    Applicant.findOne({ where: { personId: req.params.applicantId } })
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

exports.getJobs = async (req, res, next) => {
    const findOne = req.query.indexId;
    const searchTerm = req.query.searchTerm;
    const index = req.query.index;
    let limit = req.query.limit;
    const orderField = req.query.orderField || 'createdAt';
    let orderDirection = req.query.orderDirection || 'DESC';
    let order;
    let topRows = [];


    // Set the ordering
    switch(req.query.orderField) {
        // ** CHANGE THE ARRAY STRUCTURE FOR OTHER QUERIES
        // add other cases here (see getApplications)
        // Check for unique order problems (see notes in that switch function)
        case 'company': {
            order = [ 
                'company', 'name', orderDirection
            ];
            break;
        }
        case 'featured': {
            orderDirection = orderDirection === 'ASC'? 'DESC':'ASC';
            order = [ 
                orderField, orderDirection
            ];
            break;
        }
        default:
            order = [ orderField, orderDirection ];
    }

    const topRowOptions = {
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
        include: [ 
            {
                model: Company,
                attributes: ['name'],
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
    }

    // Find a specific row to highlight if needed
    try {

        if(findOne) {
            const row = await Job.findByPk(findOne, topRowOptions);
            topRows = formatJobTopRows([row]);
        }
        if(searchTerm) {
            topRowOptions.include[0].where = { name: { [Op.like]: `%${searchTerm}%` } };
            const rows = await Job.findAll(topRowOptions)
            topRows = formatJobTopRows(rows);
        }

        const options = {
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
            order: [ order ],
            distinct: true,
            // subQuery: false,
            include: [ 
                {
                    model: Company,
                    attributes: ['name'],
                }, 
                // {
                //     model: Applicant,
                //     attributes: [
                //         'id', 
                //         'cvUrl', 
                //         'personId',
                //         [Sequelize.fn('date_format', Sequelize.col('applicants.createdAt'), '%d/%m/%y'), 'createdAt'],
                //     ],
                //     include: [ 
                //         {
                //             model: Person,
                //             attributes: [ 'firstName', 'lastName', 'phone', 'email' ]
                //         } 
                //     ] 
                // }
            ]
        };

        if(req.query.limit) options.limit = parseInt(limit, 10);
        if(req.query.index) options.offset = parseInt(index);

        const results = await Job.findAndCountAll(options);
        results.rows = formatJobTopRows(results.rows)
 

        // If there's a row to be highlighted
        if(topRows.length > 0) {
            console.log('TOP ROWS',topRows)
            topRows.forEach(row => {
                const visible = results.rows.filter(job => job.id === row.id)[0];
                const index = results.rows.findIndex(job => job.id === row.id);
    
                // 1 too many results in the array
                if(results.rows.length + topRows.length > limit) {
                    // If the row appears in the array to be returned, remove it
                    if(visible) {
                        console.log('VISIBLE + LIMIT REACHED => SPLICE:  ', visible.title);
                        console.log(index);
                        results.rows.splice(index, 1);
    
                    } else {
                        console.log('NOT VISIBLE + LIMIT REACHED => POP');
                        console.log(index);
                        // Remove the last element instead
                        results.rows.pop();
                    }
                } else { 
                    if(visible) {
                        console.log('VISIBLE + LIMIT NOT REACHED REACHED', visible.title);
                        console.log(index);
    
                        results.rows.splice(index, 1);
                    } else {
                        // do nothing
                        console.log('NOT VISIBLE + LIMIT NOT REACHED', visible);
                        console.log(index);
    
                    }
                }
                
                // Add the highlighted topRow to the array
                results.rows.unshift(row) 
            })
        }

        results.rows.forEach(row => console.log(row.companyName))
        console.log(results.rows.length)

        res.status(200).json({ msg: 'Success', jobs: results.rows, total: results.count });
        return;

    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }

};

const formatJobTopRows = (rows) => {
    return rows.map(({
        dataValues: {
            id, title, wage, location, description, featured, jobDate, companyId, jobType, position, pqe,
            company: { name: companyName },
            applicants,
        }
    }) => {
        // applicants = applicants.map(({ id, cvUrl, createdAt: appliedDate, personId, person: { firstName, lastName, phone, email } }) => {
        //     const cvType = cvUrl? cvUrl.slice(cvUrl.lastIndexOf('.')):null;
        //     const cvName = cvUrl? cvUrl.slice(12): 'No CV uploaded';

        //     return { id, personId, firstName, lastName, cvType, cvName, appliedDate, phone, email };
        // });
        
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
            // applicants
            };
    });

    // rows.forEach(row => {
    //     row.dataValues.companyName = row.company.name;
    //     delete row.dataValues.company;
    // })
    // return rows;
}

exports.getJobNames = async(req, res, next) => {
    try {
        let names = await Job.findAll({
            attributes: ['id', 'title'],
            include: [
                {
                    model: Company,
                    attributes: ['name']
                }
            ]
        });
        names = names.map(({ id, title, company: { name } }) => { return { id, title, companyName: name } });
        res.status(200).json({ names: names });
        
    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return;
    }
};

exports.editJob = async (req, res, next) => {
    console.log(req.body);
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
        job.jobType = req.body.type;
        job.position = req.body.position;
        job.pqe = parseInt(req.body.pqe);

        // Format to match the other jobs in the array (company object flattened)
        job.dataValues.companyName = req.body.companyName? req.body.companyName : job.company.name;
        delete job.dataValues.company;

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
            jobType: req.body.type,
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
        // Format to match the other jobs in the array (company object flattened)
        job.dataValues.companyName = req.body.companyName? req.body.companyName : job.company.name;
        delete job.dataValues.company;

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
            console.log(err);
            if(!err.statusCode) err.statusCode = 500;
            next(err);
            return err;
        });
};

exports.getCompanyNames = async (req, res, next) => {
    try {
        const results = await Company.findAll({ attributes: ['id','name'] });

        res.status(200).json({ msg: 'Success', companyNames: results });
    } catch(err) {
        if(!err.statusCode) err.statusCode = 500;
        console.log(err);
        next(err);
        return err;
    }
};

exports.getCompanies = async (req, res, next) => {
    const findOne = req.query.indexId;
    const searchTerm = req.query.searchTerm;
    const index = req.query.index || 0;
    const limit = req.query.limit || 0;
    const orderField = req.query.orderField || 'id';
    const orderDirection = req.query.orderDirection || 'DESC';
    let order;
    let topRows = [];

    // Set the ordering
    switch(req.query.orderField) {
        // add other cases here (see getApplications)
        // Check for unique order problems (see notes in that switch function)
        default:
            order = [ orderField, orderDirection ];
    }

    const topRowOptions = {
        include: [
            {
                model: Address
            },
            {
                model: Job,
                attributes: [
                    'id',
                    'title',
                    'wage',
                    'location',
                    'description',
                    'featured',
                    'jobType',
                    'position',
                    'pqe',
                    'createdAt',
                    [Sequelize.fn('date_format', Sequelize.col('jobs.createdAt' ), '%d/%m/%y'), 'jobDate'],
                ]
            },
            {
                model: Contact,
                include: Person
            }
        ],
        attributes: [ 
            'id', 
            'name',
            'createdAt',
            [Sequelize.fn('date_format', Sequelize.col('company.createdAt' ), '%d/%m/%y'), 'companyDate'],
        ],
    }

    try {
        // Find a specific row to highlight if needed
        if(findOne) {
            const row = await Company.findByPk(findOne, topRowOptions);

            topRows = formatCompanyTopRows([row]);

            // // Format toprow to match the other array elements
            // let { id, companyDate, name: companyName, addresses, jobs, contacts } = topRow[0].dataValues;
            // jobs = jobs.map(({ dataValues: { id: jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }}) => {
            //     return {  jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }
            // });
            // contacts = contacts.map(({ dataValues: { id:contactId, position, person: { dataValues: { id: personId, firstName, lastName, phone, email } } }}) => {
            //     return { contactId, personId, position, firstName, lastName, phone, email }
            // });

            // topRow = { 
            //     id, 
            //     companyDate,
            //     companyName, 
            //     addresses,
            //     jobs,
            //     contacts
            // }
        };

        if(searchTerm) {
            topRowOptions.where =  { name: { [Op.like]: `%${searchTerm}%` } };
            const rows = await Company.findAll(topRowOptions)

            topRows = formatCompanyTopRows(rows);

            // // Format toprow to match the other array elements
            // let { id, companyDate, name: companyName, addresses, jobs, contacts } = topRow.dataValues;
            // jobs = jobs.map(({ dataValues: { id: jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }}) => {
            //     return {  jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }
            // });
            // contacts = contacts.map(({ dataValues: { id:contactId, position, person: { dataValues: { id: personId, firstName, lastName, phone, email } } }}) => {
            //     return { contactId, personId, position, firstName, lastName, phone, email }
            // });

            // topRow = { 
            //     id, 
            //     companyDate,
            //     companyName, 
            //     addresses,
            //     jobs,
            //     contacts
            // }
            console.log(searchTerm);
            console.log(topRows.length, topRows);
        }

        const options = {
            include: [
                {
                    model: Address
                },
                {
                    model: Job,
                    attributes: [
                        'id',
                        'title',
                        'wage',
                        'location',
                        'description',
                        'featured',
                        'jobType',
                        'position',
                        'pqe',
                        'createdAt',
                        [Sequelize.fn('date_format', Sequelize.col('jobs.createdAt' ), '%d/%m/%y'), 'jobDate'],

                    ]
                },
                {
                    model: Contact,
                    include: Person
                }
            ],
            attributes: [ 
                'id', 
                'name',
                'createdAt',
                [Sequelize.fn('date_format', Sequelize.col('company.createdAt' ), '%d/%m/%y'), 'companyDate'],
            ],
            order: [ order ],
            distinct: true
        }

        if(req.query.limit) options.limit = parseInt(limit, 10);
        if(req.query.index) options.offset = parseInt(index);

        const results = await Company.findAndCountAll(options);
        const temp = results.rows.map(item => item.dataValues.name);

        results.rows = results.rows.map(({
            dataValues: { id, name: companyName, companyDate, addresses, jobs, contacts }
        }) => {

            addresses = addresses.map(({ dataValues: { id, firstLine, secondLine, city, county, postcode }}) => {
                return { id, firstLine, secondLine, city, county, postcode }
            });
            jobs = jobs.map(({ dataValues: { id: jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }}) => {
                return {  jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }
            });
            contacts = contacts.map(({ dataValues: { id: contactId, position, person: { dataValues: { id: personId, firstName, lastName, phone, email } } }}) => {
                return { contactId, personId, position, firstName, lastName, phone, email }
            });

            return { 
                id, 
                companyDate,
                companyName, 
                addresses,
                jobs,
                contacts
            }
        });
      
        // If there's a row to be highlighted
        if(topRows.length > 0) {
            topRows.forEach(row => {
                const visible = results.rows.filter(company => company.id === row.id)[0];
                const index = results.rows.findIndex(company => company.id === row.id);
                // 1 too many results in the array
                if(results.rows.length + topRows.length > limit) {
                    // If the row appears in the array to be returned, remove it
                    if(visible) {
                        console.log('VISIBLE + LIMIT REACHED => SPLICE:  ', {visible});
                        console.log(index);
                        results.rows.splice(index, 1);
    
                    } else {
                        console.log('NOT VISIBLE + LIMIT REACHED => POP', {visible});
                        console.log(index);
    
                        // Remove the last element instead
                        results.rows.pop();
                    }
                } else { 
                    if(visible) {
                        console.log('VISIBLE + LIMIT NOT REACHED REACHED',{visible});
                        console.log(index);
    
                        results.rows.splice(index, 1);
                    } else {
                        console.log('NOT VISIBLE + LIMIT NOT REACHED', {visible});
                        console.log(index);
    
                    }
                }
                
                // Add the highlighted topRow to the array
                results.rows.unshift(row) 
            });

            topRows.forEach(row => console.log('TopRows', row.companyName));
            console.log('------------');
            results.rows.forEach(row => console.log('Results', row.companyName))
            console.log('-----------');
            console.log(temp);

        } 

        res.status(200).json({ companies: results.rows, companyTotal: results.count });

        return;
    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }


    // const index = req.query.index || 0;
    // const orderField = req.query.orderField || 'createdAt';
    // const order = req.query.orderDirection || 'DESC';

    // const constraints = {
    //     offset: parseInt(index),
    //     order: [[ orderField, order ]]
    // };

    // if(req.query.limit) constraints.limit = parseInt(req.query.limit);

    // // findAndCountAll returns Promise<{ count: number, rows: Model[] }>
    // return Company.findAndCountAll({
    //     attributes: [ 
    //         'id', 
    //         'name',
    //         'createdAt',
    //         [Sequelize.fn('date_format', Sequelize.col('company.createdAt' ), '%d/%m/%y'), 'companyDate'],
    //     ],
    //     // group: ['name'],
    //     ...constraints,
    //     distinct: true,
    //     include: [
    //         { model: Job }, 
    //         { model: Address },
    //         { model: Person }
    //     ]
    // }).then(results => {
    //     results.rows = results.rows.map((
    //         { 
    //             dataValues: { id, name, companyDate, addresses, people }
    //     }) => { 
    //         people = people.map(({ firstName, lastName, id: personId, email, phone, contact: { position, id: contactId } }) =>  { 
    //             return { personId, firstName, lastName, email, phone, position, contactId };
    //         });
        
    //         addresses = addresses.map(( { 
    //             dataValues: { id: addressId, firstLine, secondLine, city, county, postcode }
    //         }) => { 
    //             return { addressId, firstLine, secondLine, city, county, postcode }
    //         });

    //         return { id, name, companyDate, addresses, people }; 
    //     });

    //     res.status(200).json({ companies: results.rows, total: results.count });
    //     return;
    // }).catch(err => {
    //     console.log(err);
    //     if(!err.statusCode) err.statusCode = 500; 
    //     next(err);
    //     return err;
    // });
};

const formatCompanyTopRows = (rows) => {
    const arr = rows.map(row => {
        // Format toprow to match the other array elements
        let { id, companyDate, name: companyName, addresses, jobs, contacts } = row.dataValues;
        jobs = jobs.map(({ dataValues: { id: jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }}) => {
            return {  jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }
        });
        contacts = contacts.map(({ dataValues: { id:contactId, position, person: { dataValues: { id: personId, firstName, lastName, phone, email } } }}) => {
            return { contactId, personId, position, firstName, lastName, phone, email }
        });

        return { 
            id, 
            companyDate,
            companyName, 
            addresses,
            jobs,
            contacts
        }
    });

    return arr;
}

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

        await sequelize.transaction(async (t) => {

            let company = await Company.create({ name: req.body.companyName }, { transaction: t });

            if(!company) { const err = new Error('Error creating Company'); throw err; }


            // If the person exists as an applicant, use them
            const applicant = await Person.findOne({where: { email: req.body.email }}, { transaction: t });
            let person;

            if(!applicant) {
                person = await Person.create({ 
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    phone: req.body.phone,
                    email: req.body.email
                }, { transaction: t });
            } else {
                person = applicant;
            }

            if(!person) { const err = new Error('Error creating Person'); throw err; }

            const contact = await Contact.create({
                position: req.body.position,
            }, { transaction: t });

            if(!contact) { const err = new Error('Error creating Contact'); throw err; }

            await contact.setPerson(person, { transaction: t });
            await company.addContact(contact, { transaction: t })


            const address = await Address.create({
                firstLine: req.body.firstLine,
                secondLine: req.body.secondLine,
                city: req.body.city,
                county: req.body.county,
                postcode: req.body.postcode,
                companyId: company.id
            }, { transaction: t });

            if(!address) { const err = new Error('Error creating Address'); throw err; }

            // await company.addAddresses(address, { transaction: t });

            company = await Company.findByPk(company.id, {
                include: [
                    {
                        model: Address
                    },
                    {
                        model: Job,
                        attributes: [
                            'id',
                            'title',
                            'wage',
                            'location',
                            'description',
                            'featured',
                            'jobType',
                            'position',
                            'pqe',
                            'createdAt',
                            [Sequelize.fn('date_format', Sequelize.col('jobs.createdAt' ), '%d/%m/%y'), 'jobDate'],
                        ]
                    },
                    {
                        model: Contact,
                        include: Person
                    }
                ],
                attributes: [ 
                    'id', 
                    'name',
                    'createdAt',
                    [Sequelize.fn('date_format', Sequelize.col('company.createdAt' ), '%d/%m/%y'), 'companyDate'],
                ],
                transaction:t
            });
            
            
            // Format toprow to match the other array elements
            let { id, companyDate, name: companyName, addresses, jobs, contacts } = company.dataValues;
            jobs = jobs.map(({ dataValues: { id: jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }}) => {
                return {  jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }
            });
            contacts = contacts.map(({ dataValues: { id:contactId, position, person: { dataValues: { id: personId, firstName, lastName, phone, email } } }}) => {
                return { contactId, personId, position, firstName, lastName, phone, email }
            });

            const formattedCompany = { 
                id, 
                companyDate,
                companyName, 
                addresses,
                jobs,
                contacts
            }

            res.status(201).json({ msg: 'Success', company: formattedCompany });
        
            return;
        });
    
    } catch (err) {
        console.log(err);

        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
        return err;
    }
};

exports.createContact = async (req, res, next) => {

    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const error = new Error('Validation Error');
            error.validationErrors = errors.array({ onlyFirstError: true });
            error.statusCode = 422;
            throw error;
        }
        
        // Validation regex for phone # ignores spaces, strip any out
        const phoneNoSpace = req.body.phone.replaceAll(' ', '');
        const companyId = req.body.id;

        await sequelize.transaction(async(t) => {
            const company = await Company.findByPk(companyId, { transaction: t });
            let person;

            if(!company) {
                const error = new Error('Company Not Found');
                error.statusCode = 422;
                throw error;
            }
    
            // If the person exists as an applicant, use them
            const applicant = await Person.findOne({where: { email: req.body.email }}, { transaction: t });
    
            if(!applicant) {
                person = await Person.create({ 
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    phone: phoneNoSpace,
                    email: req.body.email
                }, { transaction: t });
            } else {
                person = applicant;
            }
    
            if(!person) { const err = new Error('Error creating Person'); throw err; }
    
            const contact = await Contact.create({
                position: req.body.position,
                person: person
            }, { 
                include:{
                    model: Person,
                    ignoreDuplicates: true,
                }, 
                transaction: t 
            });
            const { id: contactId, position, person: { id: personId, firstName, lastName, phone, email }  } = contact;


            if(!contact) { const err = new Error('Error creating Contact'); throw err; }
            
            // await contact.setPerson(person, { transaction: t });
            await company.addContact(contact, { transaction: t });

            console.dir(contactId, position, personId, firstName, lastName, phone, email)
            // console.dir(contact);

            res.status(201).json({ msg: 'Contact created', contact: { contactId, personId, firstName, lastName, phone, email, position } });
        })
 
    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }
}

exports.createAddress = async(req, res, next) => {
    const errors = validationResult(req);

    try {
        if(!errors.isEmpty()) {
            const error = new Error('Validation Error');
            error.validationErrors = errors.array({ onlyFirstError: true });
            error.statusCode = 422;
            throw error;
        } 

        // Validation regex for postcode ignores spaces, strip any out
        const postcodeNoSpace = req.body.postcode.replaceAll(' ', '');
        const companyId = req.body.id;

        await sequelize.transaction(async(t) => {
            const company = await Company.findByPk(companyId, {
                include: Address
            }, {transaction:t});

            if(!company) {
                const error = new Error('Company Not Found');
                error.statusCode = 422;
                throw error
            }
    
            // Addresses aren't unique, but return an error if the first line and postcode match 
            const existingAddress = company.dataValues.addresses.filter(({ dataValues:{firstLine, postcode} }) => {
                return req.body.firstLine === firstLine && req.body.postcode === postcode;
            })[0];

            if(existingAddress) {
                const error = new Error('Address already exists');
                error.statusCode = 422;
                throw error;
            }

            const {
                id, 
                firstLine, 
                secondLine, 
                city, 
                county, 
                postcode
            } = await Address.create({
                firstLine: req.body.firstLine,
                secondLine: req.body.secondLine,
                city: req.body.city,
                county: req.body.county,
                postcode: postcodeNoSpace,
                companyId: company.id
            }, {transaction: t});

            // await company.addAddresses(address, {transaction: t});

            res.status(201).json({ msg: 'Address created', address: {id, firstLine, secondLine, city, county, postcode} });
        });
    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }
}

exports.deleteCompany = async(req, res, next) => {
    const companyId = req.params.id;
    try {
        await sequelize.transaction(async t => {
            // Address deletion cascades
            // Deletion of Contacts cascades, but the underlying Person has to be deleted manually, unless they're an applicant
            const contacts = await Contact.findAll({ 
                where: {
                    companyId: companyId
                },
                include: [ Person ]
            });

            // A contact *has* to always exist
            if(contacts.length < 1) { const error = new Error('No Contact Exists'); error.statusCode = 422; throw error; }

            // If the contact is a person that is not an applicant, delete them
            for(const {person} of contacts) {
                const applicant = await person.getApplicant({transaction: t});

                if(!applicant) {
                    await person.destroy({transaction: t});
                }
            }

            await Company.destroy({ where: { id: companyId }, transaction: t })
        });

        res.status(200).json({ msg: 'Company Deleted' });
        return;
    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }




    // let company;

    // return sequelize.transaction(function(t) {
    //     return (
    //         Company
    //             .findByPk(req.params.id, { transaction: t })
    //             .then(result => {
    //                 if(!result) {
    //                     const error = new Error('Cannot find Company');
    //                     error.statusCode = 422;
    //                     throw error;
    //                 }
    //                 company = result;
    //                 // Returns Promise<[Person]>
    //                 return company.getPeople({transaction: t});
    //             })
    //             .then(people => {
    //                 if(people.length < 1) {
    //                     const error = new Error('Error deleting contacts. Please contact admininstrator');
    //                     error.statusCode = 500;
    //                     throw error;
    //                 }
    //                 const ids = people.map(person => person.dataValues.id);

    //                 return Person.destroy({ where: { id: ids }, transaction: t });
    //             }).then(result => {
    //                 if(!result) {
    //                     const error = new Error('Error deleting contacts');
    //                     error.statusCode = 500;
    //                     throw error;
    //                 }
    //                 return company.getJobs({ transaction: t });
    //             }).then(jobs => {
    //                 if(!jobs) {
    //                     const error = new Error('Error deleting jobs');
    //                     error.statusCode = 500;
    //                     throw error;
    //                 }
    //                 const ids = jobs.map(job => job.dataValues.id);

    //                 if(jobs.length === 0) return jobs;
    //                 // NB: Destroying the job destroys the applications
    //                 else return Job.destroy({ where: { id: ids }, transaction: t });
                    
    //             }).then(result => {
    //                 if(!result) {
    //                     const error = new Error('Error deleting jobs');
    //                     error.statusCode = 500;
    //                     throw error;
    //                 }
    //                 return company.getAddresses({ transaction: t });
    //             }).then(addresses => {
    //                 if(!addresses) {
    //                     const error = new Error('Error deleting addresses');
    //                     error.statusCode = 500;
    //                     throw error;
    //                 }
    //                 console.log(`Addresses: ${JSON.stringify(addresses)}`);
    //                 const ids = addresses.map(address => address.dataValues.id);

    //                 if(addresses.length === 0) return addresses;
    //                 else return Address.destroy({ where: { id: ids }, transaction: t });

    //             }).then(result => {
    //                 if(!result) {
    //                     const error = new Error('Error deleting addresses');
    //                     error.statusCode = 500;
    //                     throw error;
    //                 }
    //                 return company.destroy({transaction: t});
    //             })
    //     )
    // }).then(result => {
    //     if(!result) {
    //         const error = new Error('Error deleting job');
    //         error.statusCode = 500;
    //         throw error;
    //     }
    //     res.status(200).json({msg: 'Company Deleted'});
    //     return;
    // }).catch(err => {
    //     if(!err.statusCode) err.statusCode = 500; 
    //     next(err);
    //     return err;
    // });;


};

exports.editCompany = async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            const error = new Error('Validation Error');
            error.validationErrors = errors.array({ onlyFirstError: true });
            error.statusCode = 422;
            throw error;
        }

        const companyId = req.body.id;

        await sequelize.transaction(async(t) => {
            const company = await Company.findByPk(companyId, {
                // The attributes/models included match the getCompanies query
                include: [
                    {
                        model: Address
                    },
                    {
                        model: Job,
                        attributes: [
                            'id',
                            'title',
                            'wage',
                            'location',
                            'description',
                            'featured',
                            'jobType',
                            'position',
                            'pqe',
                            'createdAt',
                            [Sequelize.fn('date_format', Sequelize.col('jobs.createdAt' ), '%d/%m/%y'), 'jobDate'],
                        ]
                    },
                    {
                        model: Contact,
                        include: Person
                    }
                ],
                attributes: [ 
                    'id', 
                    'name',
                    'createdAt',
                    [Sequelize.fn('date_format', Sequelize.col('company.createdAt' ), '%d/%m/%y'), 'companyDate'],
                ],
 
            }, {transaction: t});

            if(!company) {
                const error = new Error('Company Not Found');
                error.statusCode = 422;
                throw error;
            }

            // This will only add the values to the UPDATE object if they're present
            // The current frontend sends all the values, including those not changed, but SEQUELIZE UPDATE ignores them
            // Have kept this structure in case the front end changes
            const companyValues = {};
            const contactValues = {};
            const personValues = {};
            const addressValues = {};

            if(req.body.companyName) companyValues.name = req.body.companyName;

            if(req.body.position) contactValues.position = req.body.position;

            if(req.body.firstName) personValues.firstName = req.body.firstName;
            if(req.body.lastName) personValues.lastName = req.body.lastName;
            if(req.body.phone) personValues.phone = req.body.phone;
            if(req.body.email) personValues.email = req.body.email;

            if(req.body.firstLine) addressValues.firstLine = req.body.firstLine;
            if(req.body.secondLine) addressValues.secondLine = req.body.secondLine;
            if(req.body.city) addressValues.city = req.body.city;
            if(req.body.county) addressValues.county = req.body.county;
            if(req.body.postcode) addressValues.postcode = req.body.postcode;

            // Find the contact 
            const contact = company.contacts.find(contact => contact.id === parseInt(req.body.contactId));
    
            const person = contact.person;
            
            if(!contact || !person) {
                const error = new Error('Contact Not Found');
                error.statusCode = 422;
                throw error;
            }
            await contact.update(contactValues);
            await person.update(personValues);

            // Find the address
            const address = company.addresses.find(address => address.id === parseInt(req.body.addressId));

            if(!address) {
                const error = new Error('Address Not Found');
                error.statusCode = 422;
                throw error;
            }
            await address.update(addressValues);
            await company.update(companyValues);

            // Format the company to match the getCompanies query results

            let { id, companyDate, name: companyName, addresses, jobs, contacts } = company.dataValues;
            jobs = jobs.map(({ dataValues: { id: jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }}) => {
                return {  jobId, title, wage, location, description, featured, jobType, position, pqe, jobDate }
            });
            contacts = contacts.map(({ dataValues: { id:contactId, position, person: { dataValues: { id: personId, firstName, lastName, phone, email } } }}) => {
                return { contactId, personId, position, firstName, lastName, phone, email }
            });

            const formattedCompany = { 
                id, 
                companyDate,
                companyName, 
                addresses,
                jobs,
                contacts
            }

            res.status(201).json({ msg: "Company Edited", company:formattedCompany });
        });
    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }

};  

exports.editContact = async(req, res, next) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const error = new Error('Validation Error');
            error.validationErrors = errors.array({ onlyFirstError: true });
            error.statusCode = 422;
            throw error;
        }

        await sequelize.transaction(async t => {
            const company = await Company.findByPk(req.body.id, {
                include: [
                    {
                        model: Contact,
                        include: Person
                    }
                ],
               
            }, {transaction: t});

            if(!company) { const error = new Error('No Company Found'); error.statusCode = 422; throw error }

            // Find the contact 
            const contact = company.contacts.find(contact => contact.id === parseInt(req.body.contactId));
           
            if(!contact) { const error = new Error('No Contact Found'); error.statusCode = 422; throw error }

            const person = contact.person;
            if(!person) { const error = new Error('No Person Found'); error.statusCode = 422; throw error }
   
            const contactValues = {};
            const personValues = {};

            if(req.body.position) contactValues.position = req.body.position;
            if(req.body.firstName) personValues.firstName = req.body.firstName;
            if(req.body.lastName) personValues.lastName = req.body.lastName;
            if(req.body.phone) personValues.phone = req.body.phone;
            if(req.body.email) personValues.email = req.body.email;

            await person.update(personValues);
            await contact.update(contactValues);

            const { dataValues: { id:contactId, position, person: { dataValues: { id: personId, firstName, lastName, phone, email } } }}  = contact;
            const formattedContact = { contactId, personId, position, firstName, lastName, phone, email };
           
            res.status(201).json({msg:'Contact Edited', contact: formattedContact});

        });

    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }
}

exports.editAddress = async(req, res, next) => {
    try {
        const errors = validationResult(req);
        
        if(!errors.isEmpty()) {
            const error = new Error('Validation Error');
            error.validationErrors = errors.array({ onlyFirstError: true });
            error.statusCode = 422;
            throw error;
        }

        const companyId = req.body.id;

        await sequelize.transaction(async (t) => {
            const company = await Company.findByPk(companyId, {
                include: [
                    {
                        model: Address
                    }
                ]
            }, {transaction: t});

            if(!company) { const error = new Error('No Company Found'); error.statusCode = 422; throw error }

            const address = company.addresses.find(address => address.id === parseInt(req.body.addressId));
            if(!address) { const error = new Error('No Address Found'); error.statusCode = 422; throw error }

            const addressValues = {};

            if(req.body.firstLine) addressValues.firstLine = req.body.firstLine;
            if(req.body.secondLine) addressValues.secondLine = req.body.secondLine;
            if(req.body.city) addressValues.city = req.body.city;
            if(req.body.county) addressValues.county = req.body.county;
            if(req.body.postcode) addressValues.postcode = req.body.postcode;

            await address.update(addressValues, {transaction: t});

            // Return all addresses
            // res.status(201).json({msg: 'Address Edited', addresses: company.addresses});
            res.status(201).json({ msg: 'Address Edited', address: address });
        });

    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }
};

exports.deleteAddress = async(req, res, next) => {
    const addressId = req.params.id;

    try {

        const address = await Address.findByPk(addressId, {
            include: [
                {
                    model: Company,
                    include: Address
                }
            ]
        });
        
        if(address.company.addresses.length === 1) {
            const error = new Error('Cannot delete last address');
            error.statusCode = 422;
            throw error;
        }

        await address.destroy();

        res.status(200).json({ msg: 'Address deleted' });

    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }
};

exports.deleteContact = async(req, res, next) => {
    const contactId = req.params.id;

    console.log(contactId);
    try {
        const contact = await Contact.findByPk(contactId, {
            include: [
                { 
                    model: Person,
                    include: Applicant
                },
                { model: Company, include: Contact } 
            ]
        });

        if(contact.company.contacts.length === 1) {
            const err = new Error('Cannot delete last contact');
            err.statusCode = 422;
            throw err;
        }

        // If they aren't an applicant, delete the person too
        if(!contact.person.applicant) {
            await contact.person.destroy(),
            await contact.destroy()
        } else {
            await contact.destroy();
        }

        res.status(200).json({ msg: 'Contact deleted' });

    } catch(err) {
        console.log(err);
        if(!err.statusCode) err.statusCode = 500;
        next(err);
        return err;
    }
};