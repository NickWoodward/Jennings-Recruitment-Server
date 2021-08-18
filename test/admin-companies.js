process.env.NODE_ENV = 'testing';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const sinon = require('sinon');
const faker = require('faker');

const app = require('../app');
const Company = require('../models/company');
const Person = require('../models/person');
const Address = require('../models/address');
const sequelize = require('../util/database');

const adminController = require('../controllers/admin');
//@TODO: Replace .sync with .truncate, so associations don't have to be set up each 
const { createDatabaseAssociations, populateDB } = require('./dbUtils');
const { createString } = require('../util/utils');

let connection;
const numOfTestJobs = 4;

// Root level hook for all tests
before(async () => {
    await createDatabaseAssociations();
});

after(async() => {
    await connection.close();
});

describe('Admin Controller - Companies', async() => {

    beforeEach(async() => {
        try {
            connection = await sequelize.sync({force: true});
            await populateDB();
        } catch(err){console.log(err)}
    });

    // GET COMPANIES/COMPANY
    // it('should return 200 when called', async() => {
    //     sinon.stub(Company, 'findAndCountAll');
    //     Company.findAndCountAll.resolves({
    //         rows: [ 
    //             { 
    //                 dataValues: {
    //                     id: 1, 
    //                     name: 'job1',
    //                     companyDate: '01/01/2020',
    //                     addresses: [],
    //                     people: []
    //                 }
    //             }, 
    //             { 
    //                 dataValues: {
    //                     id: 2, 
    //                     name: 'job2',
    //                     companyDate: '01/01/2020',
    //                     addresses: [],
    //                     people: []
    //                 }
    //             } 
    //         ],
    //         count: 2
    //     });

    //     const req = { query: {} };
    //     const res = {
    //         statusCode: 500,
    //         companies: [],
    //         total: 0,
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.companies = data.companies;
    //             this.total = data.total;
    //         }
    //     };

    //     await adminController.getCompanies(req, res, () => {});

    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.companies).to.be.an('array');
    //     expect(res.total).to.be.equal(res.companies.length);
    // });

    // it('should return an array and count of companies', async() => {
    //     const randomArrayIndex = Math.ceil(Math.random() * numOfTestJobs -1);
    //     const req = { query: {} };
    //     const res = {
    //         statusCode: 500,
    //         companies: [],
    //         total: 0,
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.companies = data.companies;
    //             this.total = data.total;
    //         }
    //     };

    //     await adminController.getCompanies(req, res, () => {});

    //     expect(res.companies).to.be.an('array');
    //     expect(res.companies.length).to.be.equal(numOfTestJobs);
    //     expect(res.total).to.be.equal(numOfTestJobs);

    //     expect(res.companies[randomArrayIndex]).to.include.all.keys('id', 'name', 'companyDate', 'addresses', 'people');


    //     expect(res.companies[randomArrayIndex].people).to.be.an('array').that.is.not.empty;
    //     expect(res.companies[randomArrayIndex].people[0]).to.include.all.keys('personId', 'firstName', 'lastName', 'email', 'phone', 'position', 'contactId');
    //     expect(res.companies[randomArrayIndex].addresses).to.be.an('array').that.is.not.empty;
    //     expect(res.companies[randomArrayIndex].addresses[0]).to.include.keys('addressId', 'firstLine', 'city', 'county', 'postcode');
    // });

    // it('should return the company with the given id', async() => {
    //     const randomId = Math.ceil(Math.random() * numOfTestJobs);
    //     const req = { params: { id: randomId } };
    //     const res = {
    //         statusCode: 500,
    //         msg: '',
    //         company: {},
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.msg = data.msg;
    //             this.company = data.company;
    //         }
    //     };

    //     await adminController.getCompany(req, res, () => {});
    //     expect(res.company.id).to.be.equal(randomId);
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.msg).to.be.equal('Company found');
    // });

    // it('should return 500 when getting a single company if the db connection fails', async() => {
    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.rejects();

    //     const req = { params: { id: 0 } };
    //     const error = await adminController.getCompany(req, {}, () => {});

    //     expect(error.statusCode).to.be.equal(500);
    // })

    // it('should return 422 if the companies cannot be returned', async() => {
    //     sinon.stub(Company, 'findAndCountAll');
    //     Company.findAndCountAll.resolves();

    //     const req = { query: {} };

    //     const error = await adminController.getCompanies(req, {}, () => {});

    //     expect(error.statusCode).to.be.equal(422);
    //     expect(error.message).to.be.equal('Cannot get Companies');
    // });

    // it('should return 500 when getting companies if the db connection fails', async() => {
    //     sinon.stub(Company, 'findAndCountAll');
    //     Company.findAndCountAll.rejects();

    //     const req = { query: {} };
    //     const error = await adminController.getCompanies(req, {}, () => {});

    //     expect(error.statusCode).to.be.equal(500);
    // });

    // CREATE COMPANY

    // 422 validation
    it('should return 422 if param validation fails', async() => {
        sinon.stub(Company, 'create');
        Company.create.rejects();

        const requester = chai.request(app).keepOpen();

        const minLimit = {
            companyName: '',
            firstName: 'a',
            lastName: 'a',
            position: 'a',
            phone: createString(8),
            email: 'a',
            firstLine: '',
            secondLine:  'a',
            city: 'aa',
            county: 'a',
            postcode: 'aaaa'
        };

        const maxLimit = {
            companyName: createString(51),
            firstName: createString(51),
            lastName: createString(51),
            position: createString(51),
            phone: createString(13),
            email: createString(51),
            firstLine: createString(51),
            secondLine: createString(51),
            city: createString(61),
            county: createString(51),
            postcode: createString(9)
        };

        return Promise.all([
            // Test range limits
            requester.post('/admin/create/company').send(minLimit),
            requester.post('/admin/create/company').send(maxLimit),

        ]).then(responses => {
            const expectedErrors = [
                { param: 'companyName', msg: 'Enter a company name between 1 and 50 characters' }, 
                { param: 'firstName', msg: 'Enter a first name between 2 and 50 characters' },
                { param: 'lastName', msg: 'Enter a last name between 2 and 50 characters' },
                { param: 'phone', msg: 'Must be between 9 and 12 characters' },
                { param: 'phone', msg: 'Please enter a valid UK phone number' },
                { param: 'email', msg: 'Please enter an email between 4 and 50 characters' },
                { param: 'firstLine', msg: 'Please enter a value between 1 and 50 characters' },
                { param: 'secondLine', msg: 'Please enter a value between 2 and 50 characters' },
                { param: 'city', msg: 'Please enter a value between 3 and 60 characters' },
                { param: 'county', msg: 'Please enter a county between 2 and 50 characters' },
                { param: 'postcode', msg: 'Please enter a postcode between 5 and 8 characters' }
            ];

            // Validation failed
            expect(responses[0].status).to.be.equal(422);
            expect(responses[0].body.error).to.include.deep.members(expectedErrors);

            expect(responses[1].status).to.be.equal(422);
            expect(responses[1].body.error).to.include.deep.members(expectedErrors);

            requester.close();
        }).catch(err => {
            throw err;
        });
    });

    it('should pass validation when the request body has an optional parameter', async() => {
        sinon.stub(Company, 'create');
        sinon.stub(Person, 'create');
        sinon.stub(Address, 'create');

        Company.create.resolves({
            title: 'Test Company',
            addPeople: function() { },
            addAddresses: function() { }
        });
        Person.create.resolves();
        Address.create.resolves();

        const requester = chai.request(app).keepOpen();

        // Parameter empty ''
        const secondLineEmpty = {     
            companyName: 'ConferencePlatform',
            firstName: 'Dominic',
            lastName: 'Rumsey',
            position: 'CEO',
            phone: '07635243526',
            email: 'dr@conferenceplatform.com',
            firstLine: '106 Green Park',
            secondLine: '',
            city: 'Reading',
            county: 'Berkshire',
            postcode: 'RG30 1PQ'
        };

        // Parameter missing
        const { secondLine, ...secondLineMissing } = secondLineEmpty;
        secondLineMissing.email = 'test@test2.com';

        // Parameter with a space
        const secondLineSpace = Object.assign({}, secondLineEmpty);
        secondLineSpace.secondLine = ' ';
        secondLineSpace.email = 'test@test1.com';

        return Promise.all([
            requester.post('/admin/create/company').send(secondLineEmpty),
            requester.post('/admin/create/company').send(secondLineSpace),
            requester.post('/admin/create/company').send(secondLineMissing),

        ]).then(responses => {
            expect(responses[0].status).to.not.equal(422);
            expect(responses[1].status).to.not.equal(422);
            expect(responses[2].status).to.not.equal(422);

            expect(responses[0].body.company.title).to.equal('Test Company');
            expect(responses[1].body.company.title).to.equal('Test Company');
            expect(responses[2].body.company.title).to.equal('Test Company');

            requester.close();
        }).catch(err => { throw err });
    });


    //check phone # validation

    // 500 db fails (at more than just co creation? - see if the co exists if person fails)
    // 


    afterEach(async()=> {
        sinon.restore();
    });
});

