const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const Application = require('../models/application');
const Applicant = require('../models/applicant');
const Person = require('../models/person');
const Job = require('../models/job');
const Company = require('../models/company');

exports.getApplicants = (req, res, next) => {

    Applicant.findAll({
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
                applicants = applicants.map(({ 
                    id:applicantId, 
                    createdAt, 
                    jobs,
                    person: { firstName, lastName, phone, email },
                    cvUrl
                }) => {
                    const cvType = cvUrl? cvUrl.slice(cvUrl.lastIndexOf('.')):null;
                    // Format jobs array
                    jobs = jobs.map(({ id:jobId, title, location, company: { id:companyId, name: companyName } }) => {
                        return { jobId, title, location, companyId, companyName };
                    });
                    // Format containing applicant
                    return { applicantId, firstName, lastName, phone, email, cvType, createdAt, jobs };
                });
                
                res.status(200).json({ applicants });
            }
        }).catch(err => console.log(err));

}

exports.getCv = (req, res, next) => {
    Applicant.findOne({ where: { id: req.params.applicantId } })
        .then(applicant => {
            if(applicant && applicant.cvUrl) {
                const cvName = applicant.cvUrl;
                const cvPath = path.resolve(`cvs/${cvName}`);

                const cvReadStream = fs.createReadStream(cvPath);
                res.header('Content-Disposition', `attachment; filename=${cvName}`);
                res.status(200);
                cvReadStream.pipe(res);

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