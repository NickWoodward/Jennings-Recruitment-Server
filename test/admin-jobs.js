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
let connection;

describe('Admin Controller - Jobs', async () => {
    before(async() => {
        await createDatabaseAssociations();
    });

    beforeEach(async() => {
        connection = await sequelize.sync({force: true});
        await populateDB();
    });


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

    it('should return an array and count of jobs', async() => {
        const req = { query:{} };
        const res = {
            statusCode: 500,
            jobs: [],
            total: 0,
            msg: '',
            status: function(code) {
                this.statusCode = code;
                return this;
            }, 
            json: function (data) {
                this.msg = data.msg;
                this.jobs = data.jobs;
                this.total = data.total;
            }
        };
        const jobs = await adminController.getJobs(req, res, () => {});
        expect(res.statusCode).to.be.equal(200);
        expect(res.msg).to.be.equal('Success');
        expect(res.jobs.length).to.be.equal(res.total);
    });

    it('should create a job in the database / return the job', async() => {
            const { companyId, title, wage, location, description, featured } = await createJob({});

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
    });

    it('should throw a 422 error if validation fails', async() => {
        const { companyId, title, wage, location, description, featured } = await createJob({ title: 'a' });

        console.log(title);
        const req = { body:{ companyId, title, wage, location, description, featured } };
        const res = {
            statusCode: 500,
            message: '',
            job: {},
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.message = data.message;
                this.job = data.job;
            }
        };

        await adminController.createJob(req, res, () => {});

        expect(res.statusCode).to.be.equal(422);
    });

    after(async() => {
        await connection.close();
    });
});

const createJob = async ({companyId, title, wage, location, description, featured}) => {
    // Create the dummy job data
    companyId = companyId? companyId : await faker.datatype.number({ 'min': 1, 'max': 4 });
    title = title? title : await faker.name.jobTitle();
    wage = wage? wage : await faker.random.arrayElement([ 40000, 50000, 60000, 70000, 80000, 90000 ]);
    location = location? location : await faker.address.city();
    description = description? description : await faker.name.jobDescriptor();
    featured = featured? featured : await faker.datatype.number({ 'min': 0, 'max': 1 });

    return { companyId, title, wage, location, description, featured }
};