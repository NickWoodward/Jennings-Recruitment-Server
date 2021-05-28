const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const Application = require('../models/application');
const Applicant = require('../models/applicant');
const Person = require('../models/person');
const Job = require('../models/job');
const Company = require('../models/company');


exports.editApplicant = (req, res, next) =>{
    // console.log(req.params)
    console.log(req.body.firstName);
    
    Applicant.findByPk(req.params.id, {
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

            // return res.save();
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

