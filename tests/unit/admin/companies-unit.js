const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const sinon = require('sinon');

const app = require('../../../app');
const { Op } = require('sequelize');

// Models
const Company = require('../../../models/company');
const Person = require('../../../models/person');
const Address = require('../../../models/address');
const CompanyAddress = require('../../../models/companyAddress');
const Contact = require('../../../models/contact');

const adminController = require('../../../controllers/admin');
const { createString } = require('../../../util/utils');

const numOfTestCompanies = 4;
const numOfTestCompanyAddresses = 4;

//@TODO: Replace .sync with .truncate, so associations don't have to be set up each 
describe('Admin Controller: Companies', function() {

//////// GET COMPANIES ////////
    it('should return 200 when successfully called', async() => {
        sinon.stub(Company, 'findAndCountAll');
        Company.findAndCountAll.resolves({
            rows: [
                {
                    dataValues: {
                        id: 1,
                        name: 'company1',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                },
                {
                    dataValues: {
                        id: 2,
                        name: 'company2',
                        companyDate: '02/02/2020',
                        addresses: [{dataValues:{id:2,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:2,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email2@email.com'}}}}],
                        jobs:[{dataValues:{id:2,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    
                    }
                }
            ],
            count: 2
        });

        const req = { query: {} };
        const res = {
            statusCode: 500,
            companies: [],
            total: 0,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.companies = data.companies;
                this.total = data.companyTotal;
            }
        };

        await adminController.getCompanies(req, res, () => {});

        expect(res.statusCode).to.be.equal(200);
        expect(res.companies).to.be.an('array');
        expect(res.total).to.be.equal(res.companies.length);
    });

    // 4 scenarios when getting companies with a specific row highlighted:
        // Opt 1: array length + row to be added > limit && row is in array => splice that row
        // Opt 2: array length + row to be added > limit && row *isn't* in array => pop a row
        // Opt 3: array length + row < limit, but row is in the array => splice that row 
        // Opt 4: array length + row < limit, row not in array do nothing

    // Opt 1:
    it('should splice and then unshift the row to highlight if already present and limit reached', async() => {
        const COMPANY_ID = 5;

        // Limit => the # of requested rows / rows that can be displayed
        const LIMIT = 2;

        sinon.stub(Company, 'findAndCountAll');
        sinon.stub(Company, 'findByPk');

        // Row to highlight
        Company.findByPk.resolves({
            dataValues: {
                id: COMPANY_ID,
                name: 'top company',
                companyDate: '01/01/2020',
                addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
            }
        
        });

        // Array containing the row to highlight
        Company.findAndCountAll.resolves({
            rows: [
                {
                    dataValues: {
                        id: 1,
                        name: 'company1',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                },
                {
                    dataValues: {
                        id: COMPANY_ID,
                        name: 'top company',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                }
            ],
            count: 2
        });

        const req = { query: { indexId: COMPANY_ID, limit: LIMIT } };

        const res = {
            statusCode: 500,
            companies: [],
            companyTotal: 0,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.companies = data.companies;
                this.companyTotal = data.companyTotal;
                return this;
            }
        }

        await adminController.getCompanies(req, res, ()=>{});

        expect(res.statusCode).to.be.equal(200);
        // Row to highlight at index[0]
        expect(res.companies[0].id).to.be.equal(COMPANY_ID);
        expect(res.companyTotal).to.be.equal(res.companies.length);
    })
    // Opt 2:
    it('should pop the last row to make way for the row to highlight if not present and limit reached', async() => {
        const COMPANY_ID = 5;
        const NOT_COMPANY_ID = 2;

        // Limit => the # of requested rows / rows that can be displayed
        const LIMIT = 2;

        sinon.stub(Company, 'findAndCountAll');
        sinon.stub(Company, 'findByPk');

        // Row to highlight
        Company.findByPk.resolves({
            dataValues: {
                id: COMPANY_ID,
                name: 'top company',
                companyDate: '01/01/2020',
                addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
            }
        
        });

        // Array *not* containing the row to highlight
        Company.findAndCountAll.resolves({
            rows: [
                {
                    dataValues: {
                        id: 1,
                        name: 'company1',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                },
                {
                    dataValues: {
                        id: NOT_COMPANY_ID,
                        name: 'Company to remove',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                }
            ],
            count: 2
        });

        const req = { query: { indexId: COMPANY_ID, limit: LIMIT } };

        const res = {
            statusCode: 500,
            companies: [],
            companyTotal: 0,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.companies = data.companies;
                this.companyTotal = data.companyTotal;
                return this;
            }
        }

        await adminController.getCompanies(req, res, ()=>{});

        expect(res.statusCode).to.be.equal(200);
        // Row to highlight at index[0]
        expect(res.companies[0].id).to.be.equal(COMPANY_ID);
        // I can guarantee the order with the stub, so the last item can be tested
        expect(res.companies[res.companies.length-1].id).to.not.be.equal(NOT_COMPANY_ID);
        expect(res.companyTotal).to.be.equal(res.companies.length);  
    })
    // Opt 3:
    it('should splice the row to highlight if already present, but more items can be displayed', async() => {
        const COMPANY_ID = 5;

        // Limit => the # of requested rows / rows that can be displayed
        const LIMIT = 3;

        sinon.stub(Company, 'findAndCountAll');
        sinon.stub(Company, 'findByPk');

        // Row to highlight
        Company.findByPk.resolves({
            dataValues: {
                id: COMPANY_ID,
                name: 'top company',
                companyDate: '01/01/2020',
                addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
            }
        
        });

        // Array containing the row to highlight
        Company.findAndCountAll.resolves({
            rows: [
                {
                    dataValues: {
                        id: 1,
                        name: 'company1',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                },
                {
                    dataValues: {
                        id: COMPANY_ID,
                        name: 'top company',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                }
            ],
            count: 2
        });

        const req = { query: { indexId: COMPANY_ID, limit: LIMIT } };

        const res = {
            statusCode: 500,
            companies: [],
            companyTotal: 0,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.companies = data.companies;
                this.companyTotal = data.companyTotal;
                return this;
            }
        }
        await adminController.getCompanies(req, res, ()=>{});

        expect(res.statusCode).to.be.equal(200);
        // Row to highlight at index[0]
        expect(res.companies[0].id).to.be.equal(COMPANY_ID);
        // Row spliced and unshifted, so total === length
        expect(res.companyTotal).to.be.equal(res.companies.length);
    })
    // Opt 4: 
    it('should just add the row to highlight if it is not present and more items can be displayed', async() => {
        const COMPANY_ID = 5;
        const NOT_COMPANY_ID = 2;

        // Limit => the # of requested rows / rows that can be displayed
        const LIMIT = 3;

        sinon.stub(Company, 'findAndCountAll');
        sinon.stub(Company, 'findByPk');
        
        // Row to highlight
        Company.findByPk.resolves({
            dataValues: {
                id: COMPANY_ID,
                name: 'top company',
                companyDate: '01/01/2020',
                addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
            }
        });

        // Array containing the row to highlight
        Company.findAndCountAll.resolves({
            rows: [
                {
                    dataValues: {
                        id: 1,
                        name: 'company1',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                },
                {
                    dataValues: {
                        id: NOT_COMPANY_ID,
                        name: 'Not the company to highlight',
                        companyDate: '01/01/2020',
                        addresses: [{dataValues:{id:1,firstLine:'firstLine',secondLine:'secondLine',city:'city',county:'county',postcode:'postcode'}}],
                        contacts: [{dataValues: {id:1,position:'position',person:{dataValues:{id:1,firstName:'firstName',lastName:'lastName',phone:'07484312879',email:'email1@email.com'}}}}],
                        jobs:[{dataValues:{id:1,title:'title',wage:'100000',location:'location',description:'description',featured:1,jobType:'interim',position:'position',pqe:4,jobDate:'01/01/2020'}}]
                    }
                }
            ],
            count: 2
        });

        const req = { query: { indexId: COMPANY_ID, limit: LIMIT } };

        const res = {
            statusCode: 500,
            companies: [],
            companyTotal: 0,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.companies = data.companies;
                this.companyTotal = data.companyTotal;
                return this;
            }
        }
        await adminController.getCompanies(req, res, ()=>{});

        expect(res.statusCode).to.be.equal(200);
        // Row to highlight at index[0]
        expect(res.companies[0].id).to.be.equal(COMPANY_ID);
        // Row not spliced or item popped, so companyTotal should be 1 less than companies.length
        expect(res.companyTotal).to.be.equal(res.companies.length -1);
    })


//////// END GET COMPANIES ////////

///////// DELETE COMPANIES /////////

    // it.only('should return 200 when a company with the given ID is deleted', async() => {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);

    //     sinon.stub(Company, 'findAndCountAll');
    //     Company.findAndCountAll.resolves({

    //     });

    //     sinon.stub(Company, 'destroy')

    //     const req = { params: { id: randomId } };
    //     const res = {
    //         statusCode: 500,
    //         msg: '',
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.msg = data.msg;
    //         }
    //     };

    //     await adminController.deleteCompany(req, res, () => {});
    //     const companies = adminController.getCompanies();
       
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.msg).to.be.equal('Company Deleted');
    // })

/////// END DELETE COMPANIES ///////


    // it('should return 500 when getting companies if the db connection fails', async() => {
    //     sinon.stub(Company, 'findAndCountAll');
    //     Company.findAndCountAll.rejects();

    //     const req = { query: {} };
    //     const error = await adminController.getCompanies(req, {}, () => {});

    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error')
    // });

    // it('should return an array and count of companies', async() => {
    //     const randomArrayIndex = Math.ceil(Math.random() * numOfTestCompanies -1);
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
    //     expect(res.companies.length).to.be.equal(numOfTestCompanies);
    //     expect(res.total).to.be.equal(numOfTestCompanies);

    //     expect(res.companies[randomArrayIndex]).to.include.all.keys('id', 'name', 'companyDate', 'addresses', 'people');

    //     expect(res.companies[randomArrayIndex].people).to.be.an('array').that.is.not.empty;
    //     expect(res.companies[randomArrayIndex].people[0]).to.include.all.keys('personId', 'firstName', 'lastName', 'email', 'phone', 'position', 'contactId');
    //     expect(res.companies[randomArrayIndex].addresses).to.be.an('array').that.is.not.empty;
    //     expect(res.companies[randomArrayIndex].addresses[0]).to.include.all.keys('addressId', 'firstLine', 'city', 'county', 'postcode');
    // });


    // // GET COMPANY
    // it('should return 500 when getting a single company if the db connection fails', async() => {
    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.rejects();

    //     const req = { params: { id: 0 } };
    //     const error = await adminController.getCompany(req, {}, () => {});

    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error');
    // });

    // it('should return 422 if the company cannot be returned', async() => {
    //     const req = { params: { id: numOfTestCompanies + 1 } };

    //     const error = await adminController.getCompany(req, {}, () => {});

    //     expect(error.statusCode).to.be.equal(422);
    //     expect(error.message).to.be.equal('Could not find the company');
    // });

    // it('should return the company with the given id', async() => {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);
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



    // // CREATE COMPANY
    // it('should return 500 if the db connection fails', async function() {
    //     sinon.stub(Company, 'create');
    //     Company.create.rejects();

    //     const error = await adminController.createCompany({ body: {companyName: 'test'} },{},()=>{});

    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error');
    // });

    // it('should return 422 if param validation fails', async() => {

    //     const requester = chai.request(app).keepOpen();

    //     const minLimit = {
    //         companyName: '',
    //         firstName: 'a',
    //         lastName: 'a',
    //         position: 'a',
    //         phone: createString(8),
    //         email: 'a',
    //         firstLine: '',
    //         secondLine:  'a',
    //         city: 'aa',
    //         county: 'a',
    //         postcode: 'aaaa'
    //     };

    //     const maxLimit = {
    //         companyName: createString(51),
    //         firstName: createString(51),
    //         lastName: createString(51),
    //         position: createString(51),
    //         phone: createString(13),
    //         email: createString(51),
    //         firstLine: createString(51),
    //         secondLine: createString(51),
    //         city: createString(61),
    //         county: createString(51),
    //         postcode: createString(9)
    //     };

    //     // To check to see if the tests *are* picking up the incorrect numbers,
    //     // enter a valid number, a transaction will start, Company.create is stubbed
    //     // and the server returns 500
    //     const invalidPhone04 = {
    //         companyName: 'ConferencePlatform',
    //         firstName: 'Dominic',
    //         lastName: 'Rumsey',
    //         position: 'CEO',
    //         phone: '04635243526',
    //         email: 'dr@conferenceplatform.com',
    //         firstLine: '106 Green Park',
    //         secondLine: '',
    //         city: 'Reading',
    //         county: 'Berkshire',
    //         postcode: 'RG30 1PQ'
    //     };

    //     const invalidPhone05 = Object.assign({}, invalidPhone04);
    //     invalidPhone05.phone = '05635243526';

    //     const invalidPhone8 = Object.assign({}, invalidPhone04);
    //     invalidPhone8.phone = '88635243526';

    //     const invalidEmail = Object.assign({}, invalidPhone04);
    //     invalidEmail.phone = '07484372635';
    //     invalidEmail.email = 'nickwoodward';

    //     const existingEmail = Object.assign({}, invalidEmail);
    //     const { dataValues: { email } } = await Person.findByPk(1);
    //     existingEmail.email = email;

    //     const invalidTypes = {
    //         companyName: 1,
    //         firstName: 1,
    //         lastName: 1,
    //         position: 1,
    //         phone: 1,
    //         email: 1,
    //         firstLine: 1,
    //         secondLine: 1,
    //         city: 1,
    //         county: 1,
    //         postcode: 1
    //     };

    //     return Promise.all([
    //         // Test range limits
    //         requester.post('/admin/create/company').send(minLimit),
    //         requester.post('/admin/create/company').send(maxLimit),
    //         requester.post('/admin/create/company').send(invalidPhone04),
    //         requester.post('/admin/create/company').send(invalidPhone05),
    //         requester.post('/admin/create/company').send(invalidPhone8),
    //         requester.post('/admin/create/company').send(invalidTypes),
    //         requester.post('/admin/create/company').send(invalidEmail),
    //         requester.post('/admin/create/company').send(existingEmail)

    //     ]).then(responses => {
    //         // NB: errors.array({ onlyFirstError: true });
    //         // Error if these *aren't* present. Additional errors will not cause the test to fail
    //         const expectedLimitErrors = [
    //             { param: 'companyName', msg: 'Enter a company name between 1 and 50 characters' },
    //             { param: 'firstName', msg: 'Enter a first name between 2 and 50 characters' },
    //             { param: 'lastName', msg: 'Enter a last name between 2 and 50 characters' },
    //             { param: 'phone', msg: 'Must be between 9 and 12 characters' },
    //             { param: 'email', msg: 'Please enter an email between 4 and 50 characters' },
    //             { param: 'position', msg: 'Enter a last name between 2 and 50 characters' },
    //             { param: 'firstLine', msg: 'Please enter a value between 1 and 50 characters' },
    //             { param: 'secondLine', msg: 'Please enter a value between 2 and 50 characters' },
    //             { param: 'city', msg: 'Please enter a value between 3 and 60 characters' },
    //             { param: 'county', msg: 'Please enter a county between 2 and 50 characters' },
    //             { param: 'postcode', msg: 'Please enter a postcode between 5 and 8 characters' }
    //         ];

    //         const expectedPhoneError = [{ param: 'phone', msg: 'Please enter a valid UK phone number' }];

    //         const expectedTypeErrors = Object.keys(invalidTypes).map(key => {
    //             return { param: `${key}`, msg: 'Invalid characters, please use letters and numbers only' };
    //         });

    //         const expectedEmailError = [{ param: 'email', msg: 'Please enter a valid email address' }];
    //         const expectedExistingEmailError = [{ param: 'email', msg: 'Email already exists' }];

    //         // Validation failed
    //         expect(responses[0].status).to.be.equal(422);
    //         expect(responses[0].body.error).to.include.deep.members(expectedLimitErrors);

    //         expect(responses[1].status).to.be.equal(422);
    //         expect(responses[1].body.error).to.include.deep.members(expectedLimitErrors);

    //         //@TODO: Check these validations (deep equal vs etc etc)
    //         expect(responses[2].status).to.be.equal(422);
    //         expect(responses[2].body.error).to.be.deep.equal(expectedPhoneError);

    //         expect(responses[3].status).to.be.equal(422);
    //         expect(responses[3].body.error).to.be.deep.equal(expectedPhoneError);

    //         expect(responses[4].status).to.be.equal(422);
    //         expect(responses[4].body.error).to.be.deep.equal(expectedPhoneError);

    //         expect(responses[5].status).to.be.equal(422);
    //         expect(responses[5].body.error).to.include.deep.equal(expectedTypeErrors);

    //         expect(responses[6].status).to.be.equal(422);
    //         expect(responses[6].body.error).to.include.deep.equal(expectedEmailError);

    //         expect(responses[7].status).to.be.equal(422);
    //         expect(responses[7].body.error).to.include.deep.equal(expectedExistingEmailError);

    //     })
    //     .then(() => requester.close())
    //     .catch(err => {
    //         throw err;

    //     });
    // });

    // it('should pass validation when the request body has an optional parameter', async() => {
    //     sinon.stub(Company, 'create');
    //     sinon.stub(Person, 'create');
    //     sinon.stub(Address, 'create');

    //     Company.create.resolves({
    //         title: 'Test Company',
    //         addPeople: function() { },
    //         addAddresses: function() { }
    //     });
    //     Person.create.resolves({});
    //     Address.create.resolves({});

    //     const requester = chai.request(app).keepOpen();

    //     // Parameter empty ''
    //     const secondLineEmpty = {
    //         companyName: 'ConferencePlatform',
    //         firstName: 'Dominic',
    //         lastName: 'Rumsey',
    //         position: 'CEO',
    //         phone: '07635243526',
    //         email: 'dr@conferenceplatform.com',
    //         firstLine: '106 Green Park',
    //         secondLine: '',
    //         city: 'Reading',
    //         county: 'Berkshire',
    //         postcode: 'RG30 1PQ'
    //     };

    //     // Parameter missing
    //     const { secondLine, ...secondLineMissing } = secondLineEmpty;
    //     secondLineMissing.email = 'test@test2.com';

    //     // Parameter with a space *NB: not falsey, should fail
    //     // `.optional({ checkFalsy: true })`

    //     const secondLineSpace = Object.assign({}, secondLineEmpty);
    //     secondLineSpace.secondLine = ' ';
    //     secondLineSpace.email = 'test@test1.com';

    //     return Promise.all([
    //         requester.post('/admin/create/company').send(secondLineEmpty),
    //         requester.post('/admin/create/company').send(secondLineMissing),
    //         requester.post('/admin/create/company').send(secondLineSpace),

    //     ]).then(responses => {

    //         expect(responses[0].status).to.equal(201);
    //         expect(responses[1].status).to.equal(201);
    //         // ' ' is not falsey, should fail validation
    //         expect(responses[2].status).to.equal(422);

    //         expect(responses[0].body.company.title).to.equal('Test Company');
    //         expect(responses[1].body.company.title).to.equal('Test Company');
    //         expect(responses[2].body.error[0]).to.be.deep.equal({
    //             param: 'secondLine',
    //             msg: 'Please enter a value between 2 and 50 characters'
    //         });

    //         requester.close();
    //     }).catch(err => { throw err });
    // });

    // it('should return 500 if a falsey value is returned from Company.create', async function() {
    //     sinon.stub(Company, 'create');
    //     Company.create.resolves(null);

    //     const req = { body: { companyName: 'test' } };

    //     const error = await adminController.createCompany(req,{},()=>{});
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error creating Company');
    // });

    // it('should return 500 if a falsey value is returned from Person.create', async function() {
    //     sinon.stub(Company, 'create');
    //     Company.create.resolves({});
        
    //     sinon.stub(Person, 'create');
    //     Person.create.resolves();

    //     const req = { body: { companyName: '', name: '', firstName: '', lastName: '', phone: '', email: '', firstLine: '', secondLine: '', city: '', country: '', postcode: '' } };
        
    //     const error = await adminController.createCompany(req, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error creating Person');
    // });
    
    // it('should return 500 if a falsey value is returned from Address.create', async function() {
    //     sinon.stub(Company, 'create');
    //     Company.create.resolves({});
        
    //     sinon.stub(Person, 'create');
    //     Person.create.resolves({});

    //     sinon.stub(Address, 'create');

    //     const req = { body: { firstLine: 'test', secondLine: 'test', city: 'test', country: 'test', postcode: 'test' } };
        
    //     const error = await adminController.createCompany(req, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error creating Address');
    // });

    // it('should not create the Company if the Person creation fails', async() => {
    //     const testCompany =   {
    //         companyName: 'ConferencePlatform',
    //         firstName: 'Dominic',
    //         lastName: 'Rumsey',
    //         position: 'CEO',
    //         phone: '07635243526',
    //         email: 'dr@conferenceplatform.com',
    //         firstLine: '106 Green Park',
    //         secondLine: '',
    //         city: 'Reading',
    //         county: 'Berkshire',
    //         postcode: 'RG30 1PQ'
    //     };

    //     const req = { body: { ...testCompany } };

    //     // Stub out Person.create and reject it
    //     sinon.stub(Person, 'create');
    //     Person.create.rejects();

    //     const error = await adminController.createCompany(req, {}, () => {});

    //     // Company should not exist
    //     const result = await Company.findOne({ where: { name: 'ConferencePlatform' } });

    //     expect(error).to.be.an('error');
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error');
    //     expect(result).to.be.null;
    // });

    // it("should not create the Person, Contact or Company if the Address creation fails", async () => {
    //     const testCompany = {
    //         companyName: "ConferencePlatform",
    //         firstName: "Dominic",
    //         lastName: "Rumsey",
    //         position: "CEO",
    //         phone: "07635243526",
    //         email: "dr@conferenceplatform.com",
    //         firstLine: "106 Green Park",
    //         secondLine: "",
    //         city: "Reading",
    //         county: "Berkshire",
    //         postcode: "RG30 1PQ",
    //     };

    //     const req = { body: { ...testCompany } };

    //     // Stub out Address.create and reject it
    //     sinon.stub(Address, "create");
    //     Address.create.rejects();

    //     const error = await adminController.createCompany(req, {}, () => {});

    //     // Company should not exist
    //     const company = await Company.findOne({
    //         where: { name: testCompany.companyName },
    //     });
    //     // Person should not exist
    //     const person = await Person.findOne({
    //         where: {
    //             [Op.and]: [
    //                 { firstName: testCompany.firstName },
    //                 { lastName: testCompany.lastName },
    //                 { email: testCompany.email },
    //             ],
    //         },
    //     });
    //     // Contact should not exist
    //     const contact = await Contact.findOne({
    //         where: { companyId: numOfTestCompanies + 1 }
    //     });

    //     expect(error).to.be.an("error");
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error');
    //     expect(company).to.be.null;
    //     expect(person).to.be.null;
    //     expect(contact).to.be.null;
    // });

    // it('should not create the Address, Person, Contact and Company if adding the Person as a Contact fails', async() => {
    //     const testCompany =   {
    //         companyName: 'ConferencePlatform',
    //         firstName: 'Dominic',
    //         lastName: 'Rumsey',
    //         position: 'CEO',
    //         phone: '07635243526',
    //         email: 'dr@conferenceplatform.com',
    //         firstLine: '106 Green Park',
    //         secondLine: '',
    //         city: 'Reading',
    //         county: 'Berkshire',
    //         postcode: 'RG30 1PQ'
    //     };

    //     sinon.stub(Company.prototype, 'addPeople');
    //     Company.prototype.addPeople.rejects();

    //     const req = { body: { ...testCompany } };

    //     const result = await adminController.createCompany(req, {}, () => {});

    //     const address = await Address.findOne({ where: {
    //             [Op.and]: [
    //                 { firstLine: testCompany.firstLine },
    //                 { postcode: testCompany.postcode }
    //             ]
    //         }
    //     });
    //     const numOfCompanyAddresses = await CompanyAddress.count();

    //     // Company should not exist
    //     const company = await Company.findOne({
    //         where: { name: testCompany.companyName },
    //     });
    //     // Person should not exist
    //     const person = await Person.findOne({
    //         where: {
    //             [Op.and]: [
    //                 { firstName: testCompany.firstName },
    //                 { lastName: testCompany.lastName },
    //                 { email: testCompany.email },
    //             ],
    //         },
    //     });
    //     // Contact should not exist
    //     const contact = await Contact.findOne({
    //         where: { companyId: numOfTestCompanies + 1 }
    //     });

    //     expect(result).to.be.an('error');
    //     expect(result.statusCode).to.be.equal(500);
    //     expect(result.message).to.be.equal('Error');

    //     expect(address).to.be.null;
    //     expect(contact).to.be.null;
    //     expect(person).to.be.null;
    //     expect(company).to.be.null;
    //     expect(numOfCompanyAddresses).to.be.equal(numOfTestCompanyAddresses);
    // });

    // it('should not add the Person, create the Person/Contact, or create the Address and Company if adding the Address fails', async() => {
    //     const testCompany =   {
    //         companyName: 'ConferencePlatform',
    //         firstName: 'Dominic',
    //         lastName: 'Rumsey',
    //         position: 'CEO',
    //         phone: '07635243526',
    //         email: 'dr@conferenceplatform.com',
    //         firstLine: '106 Green Park',
    //         secondLine: '',
    //         city: 'Reading',
    //         county: 'Berkshire',
    //         postcode: 'RG30 1PQ'
    //     };

    //     sinon.stub(Company.prototype, 'addPeople');
    //     Company.prototype.addPeople.rejects();

    //     const req = { body: { ...testCompany } };

    //     const result = await adminController.createCompany(req, {}, () => {});

    //     const address = await Address.findOne({ where: {
    //             [Op.and]: [
    //                 { firstLine: testCompany.firstLine },
    //                 { postcode: testCompany.postcode }
    //             ]
    //         }
    //     });
    //     const numOfCompanyAddresses = await CompanyAddress.count();

    //     const contact = await Contact.findOne({
    //         where: { companyId: numOfTestCompanies + 1 }
    //     });
    //     const person = await Person.findOne({
    //         where: { 
    //             [Op.and]: [
    //                 { firstName: testCompany.firstName },
    //                 { lastName: testCompany.lastName },
    //                 { email: testCompany.email }
    //             ]
    //         }
    //     });
    //     const company = await Company.findOne({
    //         where: { name: testCompany.companyName }
    //     });

    //     expect(result).to.be.an('error');
    //     expect(result.statusCode).to.be.equal(500);
    //     expect(result.message).to.be.equal('Error');

    //     expect(address).to.be.null;
    //     expect(contact).to.be.null;
    //     expect(person).to.be.null;       
    //     expect(company).to.be.null;

    //     expect(numOfCompanyAddresses).to.be.equal(numOfTestCompanyAddresses);
    // });

    // // DELETE COMPANY
    // it('should return 200 when a company is deleted', async function() {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);

    //     const req = { params: { id: randomId } };
    //     const res = {
    //         statusCode: 500,
    //         msg: '',
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.msg = data.msg;
    //         }
    //     };

    //     await adminController.deleteCompany(req, res, () => {});
       
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.msg).to.be.equal('Company Deleted');
    // });

    // it('should return 500 if the db connection fails', async function() {
    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.rejects();

    //     const req = { params: { id: 1 } };

    //     const error = await adminController.deleteCompany(req, {}, () => {});
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error');
    // });

    // it('should return 422 when a company is not found or a falsey value is returned', async function() {
    //     const id = numOfTestCompanies +1;

    //     const req = { params: { id: id} };

    //     const error = await adminController.deleteCompany(req, {}, () => {});
    //     expect(error.statusCode).to.be.equal(422);
    //     expect(error.message).to.be.equal('Cannot find Company');
    // });

    // // Initially prevent deletion if there isn't a Person to delete (potentially picks up logic errors elsewhere)
    // it('should return 500 and rollback if a contact for that company is not found', async function() {
    //     const id = 1;
    //     sinon.stub(Company.prototype, 'getPeople');
    //     Company.prototype.getPeople.resolves([]);

    //     const error = await adminController.deleteCompany({ params: {id: id} }, {}, () => {});

    //     const company = await Company.findByPk(1);

    //     expect(error).to.be.an('error');
    //     expect(error.message).to.be.equal('Error deleting contacts. Please contact admininstrator');
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(company).to.exist;
    //     expect(company.dataValues).to.have.property('id', id);
    // });

    // // it.only('should return 500 and rollback if it cant retrieve the contacts', async function() {
    // //     const id = 1;
    // //     sinon.stub(Company, 'findByPk');
    // //     Company.findByPk.resolves({
    // //         getPeople: function() { return new Promise((resolve, reject) => {}) }
    // //     });

    // //     sinon.stub(Company.prototype, 'getPeople');
    // //     Company.prototype.getPeople.rejects();

    // //     const error = await adminController.deleteCompany({ params: { id } }, {}, () => {});

    // //     expect(error).to.be.an('error');
    // //     expect(error.statusCode).to.be.equal(500);
    // //     expect(error.message).to.be.equal('Error');
    // // });

    // it('should return 500 and rollback if there is an error deleting related Contacts', async function() {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);

    //     sinon.stub(Person, 'destroy');
    //     Person.destroy.rejects();

    //     const req = { params: { id: randomId } };

    //     const error = await adminController.deleteCompany(req, {}, () => {});

    //     const res = { 
    //         statusCode: 0,
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

    //     const company = await adminController.getCompany(req, res, () => {});

    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error).to.be.an('error');
    //     expect(company).to.exist;
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(company.dataValues.id).to.be.equal(randomId);
    // });

    // it('should return 500 and rollback deleting Contacts and Company if error getting Jobs', async function() {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);

    //     sinon.stub(Company.prototype, 'getJobs');
    //     Company.prototype.getJobs.rejects();

    //     const numContactsBefore = await Contact.count({ where: { companyId: randomId } });

    //     const req = { params: { id: randomId } };
    //     const error = await adminController.deleteCompany(req, {}, () => {});

    //     // Check company exists after rollback
    //     const company = await Company.findByPk(randomId);
    //     const numContactsAfter = await Contact.count({ where: { companyId: randomId } });

    //     expect(error).to.be.an('error');
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(company).to.exist;
    //     expect(company.dataValues).to.have.property('id', randomId);
    //     expect(numContactsBefore).to.be.equal(numContactsAfter);
    // });

    // // it('should return 500 and rollback');

    // it('should remove the company with a given id from the database', async function() {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);

    //     const req = { params: { id: randomId } };
    //     const res = {
    //         statusCode: 500,
    //         msg: '',
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.msg = data.msg;
    //         }
    //     };
    //     const existingCompany = await Company.findByPk(randomId);

    //     await adminController.deleteCompany(req, res, () => {});

    //     const deletedCompany = await Company.findByPk(randomId);

    //     expect(existingCompany).to.exist;
    //     expect(deletedCompany).to.be.null;
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.msg).to.be.equal('Company Deleted');
    // });










    // // EDIT COMPANY
    // it.only('should return 422 if edit validation fails', async function() {

    //     // Validation rules are tested in the creation of a company
    //     const company = {
    //         companyName: '',
    //         firstName: 'a',
    //         lastName: 'a',
    //         position: 'a',
    //         phone: 'a',
    //         email: 'a',
    //         firstLine: '',
    //         secondLine:  'a',
    //         city: 'a',
    //         county: 'a',
    //         postcode: 'a'
    //     };

    //     return chai
    //             .request(app)
    //             .post(`/admin/edit/company/1/2/3`)
    //             .send(company)
    //             .then(response => {
    //                 const expectedErrors = [
    //                     { param: 'companyName', msg: 'Enter a company name between 1 and 50 characters' },
    //                     { param: 'firstName', msg: 'Enter a first name between 2 and 50 characters' },
    //                     { param: 'lastName', msg: 'Enter a last name between 2 and 50 characters' },
    //                     { param: 'phone', msg: 'Must be between 9 and 12 characters' },
    //                     { param: 'email', msg: 'Please enter an email between 4 and 50 characters' },
    //                     { param: 'position', msg: 'Enter a last name between 2 and 50 characters' },
    //                     { param: 'firstLine', msg: 'Please enter a value between 1 and 50 characters' },
    //                     { param: 'secondLine', msg: 'Please enter a value between 2 and 50 characters' },
    //                     { param: 'city', msg: 'Please enter a value between 3 and 60 characters' },
    //                     { param: 'county', msg: 'Please enter a county between 2 and 50 characters' },
    //                     { param: 'postcode', msg: 'Please enter a postcode between 5 and 8 characters' }
    //                 ];

    //                 expect(response.statusCode).to.be.equal(422);
    //                 expect(response.body.error).to.include.deep.members(expectedErrors);
    //             });
    // });

    // it.only('should return 500 if the db connection fails', async function() {
    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.rejects();

    //     const error = await adminController.editCompany({ params: { id: 1, contactId: 1, addressId: 1 } }, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error.statusCode).to.be.equal(500);
    //     expect(error.message).to.be.equal('Error')
    // });

    // it.only('should return 400 if Contact and Address params are not present', async function() {
    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.resolves({
    //         addresses: [ { addressId: 1 } ],
    //         people: [ { personId: 1 } ]
    //     });

    //     const errorContact = await adminController.editCompany({ params: { id: 1, addressId: 1 } }, {}, () => {});
    //     const errorAddress = await adminController.editCompany({ params: { id: 1, contactId: 1 } }, {}, () => {});

    //     expect(errorContact).to.be.an('error');
    //     expect(errorContact.statusCode).to.be.equal(400);
    //     expect(errorContact.message).to.be.equal('Error editing Company');

    //     expect(errorAddress).to.be.an('error');
    //     expect(errorAddress.statusCode).to.be.equal(400);
    //     expect(errorAddress.message).to.be.equal('Error editing Company');
    // });

    // it.only('should return 422 if the Company cannot be found', async function() {
    //     const id = numOfTestCompanies +1;

    //     const error = await adminController.editCompany({ params: { id: id, contactId: 1, addressId: 1 } }, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error.statusCode).to.be.equal(422);
    // });

    // it.only('should return 422 if the contactId param is not valid', async function() {
    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.resolves({
    //         addresses: [ { id: 1 } ],
    //         people: [ { id: 1 }, { id: 2 } ]
    //     });

    //     const invalidContactId = 100;

    //     const req = { params: { id: 1, addressId: 1, contactId: invalidContactId } };

    //     const error = await adminController.editCompany(req, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error.statusCode).to.be.equal(422);
    //     expect(error.message).to.be.equal('Error editing Company');
    // });

    // it.only('should return 422 if the addressId param is not valid', async function() {
    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.resolves({
    //         addresses: [ { id: 1 }, { id: 2 } ],
    //         people: [ { id: 1 }, { id: 2 } ]
    //     });

    //     const invalidAddressId = 100;

    //     const req = { params: { id: 1, addressId: invalidAddressId, contactId: 1 } };

    //     const error = await adminController.editCompany(req, {}, () => {});

    //     expect(error).to.be.an('error');
    //     expect(error.statusCode).to.be.equal(422);
    //     expect(error.message).to.be.equal('Error editing Company');
    // });

    // it.only('should return 500 if no related Contact is found', async function() {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);

    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.resolves({
    //         addresses: [ { addressId: 1 } ],
    //         people: []
    //     });

    //     const errorPeople = await adminController.editCompany({ params: { id: randomId, contactId: 100, addressId: 100 } }, {}, () => {});

    //     expect(errorPeople).to.be.an('error');
    //     expect(errorPeople.message).to.be.equal('Error editing Company');
    //     expect(errorPeople.statusCode).to.be.equal(500);
    // });

    // it.only('should return 500 if no related Address is found', async function() {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);

    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.resolves({
    //         addresses: [],
    //         people: [ { id: 1 } ]
    //     });

    //     const errorAddresses = await adminController.editCompany({ params: { id: randomId, contactId: 1, addressId: 100 } }, {}, () => {});

    //     expect(errorAddresses).to.be.an('error');
    //     expect(errorAddresses.message).to.be.equal('Error editing Company');
    //     expect(errorAddresses.statusCode).to.be.equal(500);
    // });

    // it.only('should return 200 if update successful', async function() {
    //     sinon.stub(Company, 'findByPk');
    //     Company.findByPk.resolves({
    //         addresses: [ { id: 1, save: () => { return } } ],
    //         people: [ { id: 1,  contact: { position: '' }, save: () => { return } } ],
    //         save: function() { return }
    //     });

    //     const testCompany = {
    //         companyName: 'test',
    //         firstName: 'test',
    //         lastName: 'test',
    //         position: 'test',
    //         phone: '0777777777',
    //         email: 'dr@gamil.com',
    //         firstLine: 'test',
    //         secondLine: 'test',
    //         city: 'test',
    //         county: 'test',
    //         postcode: 'RG1 1PR'
    //     };

    //     const req = {
    //         params: { id: 1, addressId: 1, contactId: 1 },
    //         body: { ...testCompany }
    //     };
    //     const res = {
    //         statusCode: 0,
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
    //     }

    //     const error = await adminController.editCompany(req, res, () => {});
    //     expect(error).to.be.undefined;
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(res.msg).to.be.equal('Company successfully updated');
    // });

    // it.only('should correctly update the Company', async function() {
    //     const randomId = Math.ceil(Math.random() * numOfTestCompanies);

    //     const company = await Company.findByPk(randomId, { include: [ { model: Person }, { model: Address } ] });
        
    //     // Take the ids of the last entry in each array
    //     const contactId = company.people[company.people.length -1].id;
    //     const addressId = company.addresses[company.addresses.length -1].id;

    //     const editedCompany = {
    //         companyName: 'test',
    //         firstName: 'test',
    //         lastName: 'test',
    //         position: 'test',
    //         phone: '0777777777',
    //         email: 'dr@gamil.com',
    //         firstLine: 'test',
    //         secondLine: 'test',
    //         city: 'test',
    //         county: 'test',
    //         postcode: 'RG1 1PR'
    //     };

    //     const req = {
    //         params: { id: randomId, contactId, addressId },
    //         body: { ...editedCompany }
    //     };
    //     const res = {
    //         statusCode: 0,
    //         msg: '',
    //         company: {},
    //         status: function(code) {
    //             this.statusCode = code;
    //             return this;
    //         },
    //         json: function(data) {
    //             this.company = data.company;
    //             this.msg = data.msg;
    //         }
    //     };

    //     const error = await adminController.editCompany(req, res, () => {});

    //     // Destructure the sequelize model returned in the response
    //     const {
    //         id,
    //         name,
    //         addresses,
    //         people
    //     } = res.company;
 
    //     // Extract the address from each of the sequelize models
    //     const mappedAddresses = addresses.map(address => {
    //         const { id, companyaddress, createdAt, updatedAt, ...values } = address.dataValues;
    //         return values;
    //     });

    //     const mappedPeople = people.map(person => {
    //         const { id, createdAt, updatedAt, contact, ...values } = person.dataValues;
    //         return { position: contact.position, ...values }
    //     });

    //     // Extract the address and the contact from the test company
    //     const { companyName, firstName, lastName, position, phone, email, ...address  } = editedCompany;
    //     const { companyName: coName, firstLine, secondLine, city, county, postcode, ...person } = editedCompany;

    //     expect(error).to.be.undefined;
    //     expect(res.statusCode).to.be.equal(200);
    //     expect(id).to.be.equal(randomId);
    //     expect(name).to.be.equal(editedCompany.companyName);
    //     expect(mappedAddresses).to.deep.include(address);
    //     expect(mappedPeople).to.deep.include(person);
    // });

    // // *** CHECK EMAIL UNIQUE


    // //**************** @TODO: Go through code in controller and check where sequelize could return null, and where checks are necessary */
    // it('test returns', async function() {
    //     // Returns the empty array
    //     // const result = await Contact.findAll({ where: { companyId: 10 } });
    //     // console.log(result);

    //     // // Returns null
    //     // const company = await Company.findByPk(10);
    //     // console.log(company);

    //     // // Returns the created object
    //     // const createReturn = await Address.create({ firstLine: 'test', secondLine: 'test', city: 'test', county: 'test', postcode: 'sn105kd'});
        
    //    // No person exists
    //    const testCo = await Company.create({ name: 'test' });
    //    const person = await Person.create({ firstName: 'nick', lastName: 'test', email: 'test@te3st.com', phone: '07352635263' });
    //    await person.addCompany(testCo, { through: { position: 'test' } })
    // //    console.log(testCo);
    //    const people = await testCo.getPeople();
    //    console.log(people);
    // });
});

