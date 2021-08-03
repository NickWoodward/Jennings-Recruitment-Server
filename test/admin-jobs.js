require('dotenv').config();
process.env.NODE_ENV = 'testing';

const expect = require('chai').expect;
const sinon = require('sinon');
const faker = require('faker');

const sequelize = require('../util/database');

const adminController = require('../controllers/admin');
const { createDatabaseAssociations, populateDB } = require('./utils');

// MODELS
const Job = require('../models/job');
const Person = require('../models/person');
const Company = require('../models/company');
const Contact = require('../models/contacts');
const Applicant = require('../models/applicant');
const Application = require('../models/application');
const Address = require('../models/address');
const CompanyAddress = require('../models/companyAddress');


faker.locale = "en_GB";

describe('Admin Controller - Jobs', async () => {
    await createDatabaseAssociations();

    it('Should throw a 500 error if accessing the DB fails', async () => {
        sinon.stub(Job, 'findAndCountAll');
        Job.findAndCountAll.rejects();

        const req = {
            query: {}
        };

        const result = await adminController.getJobs(req, {}, () => {});

        expect(result).to.be.an('error');
        expect(result).to.have.property('statusCode', 500);

        Job.findAndCountAll.restore();
    });

    // it('should return an array and count of jobs', async() => {
    //     sequelize.sync({force: true})
    //         .then(async result => {
    //             await populateDB();

    //             const req = { query:{} };
    //             const res = {
    //                 statusCode: 500,
    //                 jobs: [],
    //                 total: 0,
    //                 msg: '',
    //                 status: function(code) {
    //                     this.statusCode = code;
    //                     return this;
    //                 }, 
    //                 json: function (data) {
    //                     this.msg = data.msg;
    //                     this.jobs = data.jobs;
    //                     this.total = data.total;
    //                 }
    //             };
    //             const jobs = await adminController.getJobs(req, res, () => {});
    //             expect(res.statusCode).to.be.equal(200);
    //             expect(res.msg).to.be.equal('Success');
    //             expect(res.jobs.length).to.be.equal(res.total);
    //         }).catch(err => console.log(err));
    // });

    it('should return the created job', async() => {
        sequelize.sync({force: true})
            .then(async result => {
                await populateDB();

                // Create the dummy job data
                const companyId = await faker.datatype.number({ 'min': 1, 'max': 4 });
                const title = await faker.name.jobTitle();
                const wage = await faker.random.arrayElement([ 40000, 50000, 60000, 70000, 80000, 90000 ]);
                const location = await faker.address.city();
                const description = await faker.name.jobDescriptor();
                const featured = await faker.datatype.number({ 'min': 0, 'max': 1 });

                const req = { body:{ companyId, title, wage, location, description, featured } };
                const res = {
                    statusCode: 500,
                    job: {},    
                    message: '',
                    status: function(code) {
                        this.statusCode = code;
                        return this;
                    }, 
                    json: function (data) {
                        this.message = data.message;
                        this.job = data.job;
                    }
                };
                await adminController.createJob(req, res, () => {});

                const databaseEntry = await Job.findByPk(res.job.dataValues.id);

                const returnedJob = { 
                    ...req.body,
                    id: res.job.dataValues.id, 
                    featured: featured? true : false, 
                    createdAt: res.job.dataValues.createdAt,
                    updatedAt: res.job.dataValues.updatedAt 
                };

                expect(res.statusCode).to.be.equal(201);
                expect(res.message).to.be.equal('Job created');
                expect(res.job.dataValues).to.be.eql(returnedJob);
                expect(res.job.dataValues).to.be.eql(databaseEntry.dataValues);
            }).catch(err => console.log(err));
    });
});