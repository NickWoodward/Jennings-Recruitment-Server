process.env.NODE_ENV = 'testing';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const sinon = require('sinon');
const faker = require('faker');

// const app = require('../app');
const sequelize = require('../util/database');
const { Op } = require("sequelize");

const adminController = require('../controllers/admin');
const { createDatabaseAssociations, populateDB } = require('./dbUtils');
const { createString } = require('../util/utils');

// MODELS
const Job = require('../models/job');
const Applicant = require('../models/applicant');
const Application = require('../models/application');

faker.locale = "en_GB";

let connection;
const numOfTestJobs = 4;

// describe('Admin Controller - Jobs', async () => {
    // before(async() => {
    //     await createDatabaseAssociations();
    // });

    // beforeEach(async() => {
    //     try {
    //         connection = await sequelize.sync({force: true});
    //         await populateDB();
    //     } catch(err){console.log(err)}
    // });


    // // GETTING JOB/JOBS
    // it('Should throw a 500 error if findAndCountAll fails', async () => {
    //     sinon.stub(Job, 'findAndCountAll');
    //     Job.findAndCountAll.rejects();

    //     const req = {
    //         query: {}
    //     };

    //     const result = await adminController.getJobs(req, {}, () => {});

    //     expect(result).to.be.an('error');
    //     expect(result).to.have.property('statusCode', 500);

    //     // Job.findAndCountAll.restore();
    // });

    // it('should return an array and count of jobs', async() => {
    //     const req = { query:{} };
    //     const res = {
    //         statusCode: 500,
    //         jobs: [],
    //         total: 0,
    //         msg: '',
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         }, 
    //         json: function (data) {
    //             this.msg = data.msg;
    //             this.jobs = data.jobs;
    //             this.total = data.total;
    //         }
    //     };
    //     await adminController.getJobs(req, res, () => {});
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.msg).to.be.equal('Success');
    //     expect(res.jobs.length).to.be.equal(res.total);
    //     expect(res.jobs).to.be.an('array');
    // });

    // it('should return the job with the given id', async() => {
    //     const randomParamId = Math.ceil(Math.random() * numOfTestJobs);

    //     const req = { params: { id: randomParamId } };
    //     const res = {
    //         statusCode: 500,
    //         message: '',
    //         job: {},
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.message = data.message,
    //             this.job = data.job
    //         } 
    //     };

    //     await adminController.getJob(req, res, () => {});

    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.job.id).to.be.equal(randomParamId);
    // });

    // it('should return 404 if the id is incorrect', async() => {
    //     const id = numOfTestJobs + 1;

    //     sinon.stub(Job, 'findByPk');
    //     Job.findByPk.resolves()

    //     const req = { params: { id: id } };
 
    //     const error = await adminController.getJob(req, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error).to.have.property('statusCode', 404);
    // });


    // // CREATING JOB
    // it('should create a job in the database / return the job', async() => {
    //     const { companyId, title, wage, location, description, featured } = await createJob({});

    //     const req = { body:{ companyId, title, wage, location, description, featured } };
    //     const res = {
    //         statusCode: 500,
    //         job: {},    
    //         message: '',
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         }, 
    //         json: function (data) {
    //             this.message = data.message;
    //             this.job = data.job;
    //         }
    //     };
    //     await adminController.createJob(req, res, () => {});

    //     const databaseEntry = await Job.findByPk(res.job.dataValues.id);

    //     const returnedJob = { 
    //         ...req.body,
    //         id: res.job.dataValues.id, 
    //         featured: featured? true : false, 
    //         createdAt: res.job.dataValues.createdAt,
    //         updatedAt: res.job.dataValues.updatedAt 
    //     };
    //     expect(res.statusCode).to.be.equal(201);
    //     expect(res.message).to.be.equal('Job created');
    //     expect(res.job.dataValues).to.be.eql(returnedJob);
    //     expect(res.job.dataValues).to.be.eql(databaseEntry.dataValues);
    // });

    // it('should throw a 422 error if the job cannot be created', async() => {
    //     sinon.stub(Job, 'create');
    //     Job.create.resolves();

    //     const job = await createJob({});
    //     const req = { body: { ...job } };
        
    //     const error = await adminController.createJob(req, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error).to.have.property('message', 'Could not create the job');
    //     expect(error).to.have.property('statusCode', 422);

    //     // Job.create.restore();
    // }); 

    // it('should throw a 422 error if validation fails', async() => {
    //     const requester = chai.request(app).keepOpen();

    //     // The validation object can be printed from the error handling module to check each is failing
    //     const minLimit = await createJob({ title: 'ab', wage: 1000, location: 'ab', description: 'abcd', featured: '-1' });
    //     const maxLimit = await createJob({ title: createString(51), wage: 100000000, location: createString(51), description: createString(501) });

    //     return Promise.all([
    //         requester.post('/admin/create/job').type('form').send(minLimit),
    //         requester.post('/admin/create/job').type('form').send(maxLimit),
    //     ]).then(responses => {
    //         expect(responses[0].status).to.be.equal(422);
    //         expect(responses[1].status).to.be.equal(422);
    //         requester.close();
    //     })
    //     .catch(err => {throw err}) ;
    // });

    // it('should throw a 404 if the company the job is created for is not found', async() => {
    //     const randomParamId = Math.ceil(Math.random() * 10) + numOfTestJobs;

    //     const job = await createJob({ companyId: randomParamId });

    //     const req = { body: { ...job } };

    //     const error = await adminController.createJob(req, {}, () => {});
    //     expect(error).to.be.an('error');
    //     expect(error).to.have.property('message', 'No such Company exists');
    //     expect(error).to.have.property('statusCode', 404);
    // });

    // // DELETING JOBS
    // it('should return 200 if job deleted', async() => {
    //     // There are 4 test jobs in the db
    //     const randomParamId = Math.ceil(Math.random() * numOfTestJobs);

    //     const req = { params: { id: randomParamId } };
    //     const res = { 
    //         statusCode: 500,
    //         message: '',
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.message = data.message;
    //         }
    //     };

    //     await adminController.deleteJob(req, res, () => {});

    //     expect(res.statusCode).to.be.equal(200);
    // });

    // it('should return 422 if the job cannot be found', async() => {
    //     const randomParamId = Math.ceil(Math.random() * 5) + numOfTestJobs;

    //     sinon.stub(Job, 'findByPk');
    //     Job.findByPk.resolves();

    //     const req = { params: { id: randomParamId } };
    //     const res = {};

    //     const error = await adminController.deleteJob(req, res, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error).to.have.property('statusCode', 422);
    // });

    // it('should return 500 if the job cannnot be deleted', async() => {
    //     sinon.stub(Job, 'findByPk');
    //     Job.findByPk.resolves({ 
    //         destroy: function() {
    //             return new Promise((resolve, reject) => { resolve() });
    //         }
    //     });

    //     const res = { params: { id: 1 } };

    //     const error = await adminController.deleteJob(res, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error).to.have.property('statusCode', 500);
    //     expect(error).to.have.property('message', 'Error deleting job');
    // });

    // it('should remove the job from the db if deleted', async() => {
    //     const randomParamId = Math.ceil(Math.random() * numOfTestJobs);

    //     const req = { params: { id: randomParamId } };
    //     const res = { 
    //         statusCode: 500,
    //         message: '',
    //         job: {},
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.message = data.message;
    //             this.job = data.job
    //         }
    //     };
    //     await adminController.deleteJob(req, res, () => {});
        
    //     expect(res.statusCode).to.be.equal(200);

    //     const result = await adminController.getJob(req, res, () => {});

    //     expect(result).to.be.an('error');
    //     expect(result).to.have.property('statusCode', 404);
    // });

    // it('should delete the applications for the given job', async() => {
    //     const randomParamId = Math.ceil(Math.random() * numOfTestJobs);

    //     const req = { params: { id: randomParamId } };
    //     const res = {};

    //     await adminController.deleteJob(req, res, () => {});

    //     const applicants = await Application.findAll({ where: { jobId: randomParamId } });

    //     expect(applicants).to.be.an('array').that.is.empty;
    // });

    // it('should not delete applicants that are related to a deleted job', async() => {
    //     const randomParamId = Math.ceil(Math.random() * numOfTestJobs);

    //     const req = { params: { id: randomParamId } };
    //     const res = {
    //         statusCode: '500',
    //         message: '',
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.message = data.message;
    //         }
    //     };

    //     const job = await Job.findByPk(randomParamId);
    //     let applicants = await job.getApplicants();
        
    //     applicants = applicants.map(applicant => applicant.dataValues.personId);
    //     await adminController.deleteJob(req, res, () => {});

    //     expect(res.statusCode).to.be.equal(200);

    //     let results = await Applicant.findAll({ 
    //         where: { 
    //             id: {
    //                 [Op.or]: applicants
    //             }
    //         } 
    //     });
    //     results = results.map(applicant => applicant.dataValues.id);
    //     expect(results).to.be.an('array').that.is.not.empty;
    // });

    // // // EDITING JOBS
    // it('should return 422 if validation fails', async() => {
    //     const requester = chai.request(app).keepOpen();

    //     // The validation object can be printed from the error handling module to check each is failing
    //     const minLimit = await createJob({ title: 'ab', wage: 1000, location: 'ab', description: 'abcd', featured: '-1' });
    //     const maxLimit = await createJob({ title: createString(51), wage: 100000000, location: createString(51), description: createString(501) });

    //     return Promise.all([
    //         requester.post('/admin/create/job').type('form').send(minLimit),
    //         requester.post('/admin/create/job').type('form').send(maxLimit),
    //     ]).then(responses => {
    //         expect(responses[0].status).to.be.equal(422);
    //         expect(responses[1].status).to.be.equal(422);
    //         requester.close();
    //     })
    //     .catch(err => {throw err}) ;
    // });

    // it('should return 422 if no job is found', async() => {
    //     sinon.stub(Job, 'findOne');
    //     Job.findOne.resolves();

    //     const req = { params: { id: 9 } }; 

    //     const error = await adminController.editJob(req, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error).to.have.property('statusCode', 422);
    //     expect(error).to.have.property('message', 'Job not found');
    // }); 

    // it('should return 200 if the job is edited', async() => {
    //     const job = await createJob({});
    //     const randomParamId = Math.ceil(Math.random() * numOfTestJobs);

    //     sinon.stub(Job, 'findOne');
    //     Job.findOne.resolves({ 
    //         save: function() {
    //             return new Promise((resolve, reject) => { resolve({ id: randomParamId }) });
    //         }
    //     });

    //     const req = { body: { ...job }, params: { id: randomParamId } };
    //     const res = {
    //         statusCode: 500,
    //         message: '',
    //         job: {},
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.job = data.job;
    //             this.message = data.message;
    //         }
    //     };

    //     await adminController.editJob(req, res, () => {});

    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.job.id).to.be.equal(randomParamId);
    //     expect(res.message).to.be.equal('Job edited');
    // });

    // it('should return 500 if the job cannot be saved', async() => {
    //     const job = await createJob({});

    //     sinon.stub(Job, 'findOne');
    //     Job.findOne.resolves({ 
    //         ...job, 
    //         save: function() {
    //             return new Promise((resolve, reject) => resolve())
    //         }
    //     });

    //     const req = { body: { ...job }, params: { id: 10 } };
        
    //     const error = await adminController.editJob(req, {}, ()=>{});

    //     expect(error).to.be.an('error');
    //     expect(error).to.have.property('statusCode', 422);
    //     expect(error).to.have.property('message', 'Error editing the job');
    // });

    // it('should update the correct job in the database', async () => {
    //     // Get job from the DB
    //     const randomParamId = Math.ceil(Math.random() * numOfTestJobs);

    //     const editedJob = await createJob({ 
    //         id: randomParamId,
    //         title: 'Head of Marketing', 
    //         location: 'Swindon',
    //         wage: 50000,
    //         description: 'This is a test job',
    //         featured: '0',
    //     });

    //     const req = { body: { ...editedJob }, params: { id: randomParamId } };
    //     const res = {
    //         statusCode: 500,
    //         message: '',
    //         job: {},
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.message = data.message;
    //             this.job = data.job;
    //         }
    //     };

    //     await adminController.editJob(req, res, () => {});

    //     const { dataValues: { id, title, location, featured, companyId } } = await Job.findByPk(randomParamId);

    //     const result  = res.job.dataValues;

    //     expect(res.statusCode).to.be.equal(200);
    //     expect(result.id).to.be.equal(id);
    //     expect(result.title).to.be.equal(title);
    //     expect(result.location).to.be.equal(location);
    //     expect(result.featured).to.be.equal(featured);
    //     expect(result.companyId).to.be.equal(companyId);
    // });

    // afterEach(async()=> {
    //     sinon.restore();
    // });

    // after(async() => {
    //     await connection.close();
    // });
// });

const createJob = async ({companyId, title, wage, location, description, featured}) => {
    // Create the dummy job data
    companyId = companyId? companyId : await faker.datatype.number({ 'min': 1, 'max': numOfTestJobs });
    title = title? title : await faker.name.jobTitle();
    wage = wage? wage : await faker.random.arrayElement([ 40000, 50000, 60000, 70000, 80000, 90000 ]);
    location = location? location : await faker.address.city();
    description = description? description : await faker.name.jobDescriptor();
    featured = featured? parseInt(featured) : await faker.datatype.number({ 'min': 0, 'max': 1 });

    return { companyId, title, wage, location, description, featured }
};
