require('dotenv').config();
process.env.NODE_ENV = 'testing';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const sinon = require('sinon');
const faker = require('faker');

const app = require('../app');
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
        try {

        connection = await sequelize.sync({force: true});
        await populateDB();
        } catch(err){console.log(err)}
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
        const requester = chai.request(app).keepOpen();

        // The validation object can be printed from the error handling module to check each is failing
        const minLimit = await createJob({ title: 'ab', wage: 1000, location: 'ab', description: 'abcd', featured: -1 });
        const maxLimit = await createJob({ title: createString(51), wage: 100000000, location: createString(51), description: createString(501) });

        return Promise.all([
            requester.post('/admin/create/job').type('form').send(minLimit),
            requester.post('/admin/create/job').type('form').send(maxLimit),
        ]).then(responses => {
            expect(responses[0].status).to.be.equal(422);
            expect(responses[1].status).to.be.equal(422);
            requester.close();
        })
        .catch(err => {throw err}) ;
    });

    it('should throw a 404 if the company the job is created for is not found', async() => {
        // There are 4 companies in the dummy data
        const job = await createJob({companyId: 5});

        return chai
            .request(app)
            .post('/admin/create/job')
            .type('form')
            .send(job)
            .then(res => {
                expect(res.status).to.be.equal(404);
                expect(res.json.message).to.include('No such Company exits');
            })
            .catch(err => {throw err} );

    });

    it('should return 200 if job deleted', async() => {
        // There are 4 test jobs in the db
        const randomId = Math.ceil(Math.random() * 4);

        const req = { params: { id: randomId } };
        const res = { 
            statusCode: 500,
            message: '',
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.message = data.message;
            }
        };

        await adminController.deleteJob(req, res, () => {});

        expect(res.statusCode).to.be.equal(200);
    });

    it('should remove the job from the db if deleted', async() => {
        // There are 4 test jobs in the db
        const randomId = Math.ceil(Math.random() * 4);

        const req = { params: { id: randomId } };
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
                this.job = data.job
            }
        };
        await adminController.deleteJob(req, res, () => {});
        
        expect(res.statusCode).to.be.equal(200);

        const result = await adminController.getJob(req, res, () => {});

        expect(result).to.be.an('error');
        expect(result).to.have.property('statusCode', 404);
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

const createString = (num) => {
    let temp = '';
    for(let x = 0; x <= num; x++) {
        temp += 'a';
    }
    return temp;
} 