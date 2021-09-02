const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const sinon = require('sinon');

const app = require('../../app');
const { Op } = require('sequelize');

// Models
const Company = require('../../models/company');
const Person = require('../../models/person');
const Address = require('../../models/address');
const CompanyAddress = require('../../models/companyAddress');
const Contact = require('../../models/contacts');

const adminController = require('../../controllers/admin');
const { createString } = require('../../util/utils');

const numOfTestCompanies = 4;
const numOfTestCompanyAddresses = 4;

//@TODO: Replace .sync with .truncate, so associations don't have to be set up each 
describe('Admin Controller: Companies', function() {

    // GET COMPANIES/COMPANY
    it('should return 200 when called', async() => {
        sinon.stub(Company, 'findAndCountAll');
        Company.findAndCountAll.resolves({
            rows: [
                {
                    dataValues: {
                        id: 1,
                        name: 'job1',
                        companyDate: '01/01/2020',
                        addresses: [],
                        people: []
                    }
                },
                {
                    dataValues: {
                        id: 2,
                        name: 'job2',
                        companyDate: '01/01/2020',
                        addresses: [],
                        people: []
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
                this.total = data.total;
            }
        };

        await adminController.getCompanies(req, res, () => {});

        expect(res.statusCode).to.be.equal(200);
        expect(res.companies).to.be.an('array');
        expect(res.total).to.be.equal(res.companies.length);
    });

    it('should return 500 when getting a single company if the db connection fails', async() => {
        sinon.stub(Company, 'findByPk');
        Company.findByPk.rejects();

        const req = { params: { id: 0 } };
        const error = await adminController.getCompany(req, {}, () => {});

        expect(error.statusCode).to.be.equal(500);
    });

    it('should return 500 when getting companies if the db connection fails', async() => {
        sinon.stub(Company, 'findAndCountAll');
        Company.findAndCountAll.rejects();

        const req = { query: {} };
        const error = await adminController.getCompanies(req, {}, () => {});

        expect(error.statusCode).to.be.equal(500);
    });

    it('should return 422 if the companies cannot be returned', async() => {
        sinon.stub(Company, 'findAndCountAll');
        Company.findAndCountAll.resolves();

        const req = { query: {} };

        const error = await adminController.getCompanies(req, {}, () => {});

        expect(error.statusCode).to.be.equal(422);
        expect(error.message).to.be.equal('Cannot get Companies');
    });

    it('should return 422 if the company cannot be returned', async() => {
        const req = { params: { id: numOfTestCompanies + 1 } };

        const error = await adminController.getCompany(req, {}, () => {});

        expect(error.statusCode).to.be.equal(422);
        expect(error.message).to.be.equal('Could not find the company');
    });

    it('should return an array and count of companies', async() => {
        const randomArrayIndex = Math.ceil(Math.random() * numOfTestCompanies -1);
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
                this.total = data.total;
            }
        };

        await adminController.getCompanies(req, res, () => {});

        expect(res.companies).to.be.an('array');
        expect(res.companies.length).to.be.equal(numOfTestCompanies);
        expect(res.total).to.be.equal(numOfTestCompanies);

        expect(res.companies[randomArrayIndex]).to.include.all.keys('id', 'name', 'companyDate', 'addresses', 'people');

        expect(res.companies[randomArrayIndex].people).to.be.an('array').that.is.not.empty;
        expect(res.companies[randomArrayIndex].people[0]).to.include.all.keys('personId', 'firstName', 'lastName', 'email', 'phone', 'position', 'contactId');
        expect(res.companies[randomArrayIndex].addresses).to.be.an('array').that.is.not.empty;
        expect(res.companies[randomArrayIndex].addresses[0]).to.include.all.keys('addressId', 'firstLine', 'city', 'county', 'postcode');
    });

    it('should return the company with the given id', async() => {
        const randomId = Math.ceil(Math.random() * numOfTestCompanies);
        const req = { params: { id: randomId } };
        const res = {
            statusCode: 500,
            msg: '',
            company: {},
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.msg = data.msg;
                this.company = data.company;
            }
        };

        await adminController.getCompany(req, res, () => {});

        expect(res.company.id).to.be.equal(randomId);
        expect(res.statusCode).to.be.equal(200);
        expect(res.msg).to.be.equal('Company found');
    });



    // CREATE COMPANY
    it('should return 422 if param validation fails', async() => {

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

        // To check to see if the tests *are* picking up the incorrect numbers,
        // enter a valid number, a transaction will start, Company.create is stubbed
        // and the server returns 500
        const invalidPhone04 = {
            companyName: 'ConferencePlatform',
            firstName: 'Dominic',
            lastName: 'Rumsey',
            position: 'CEO',
            phone: '04635243526',
            email: 'dr@conferenceplatform.com',
            firstLine: '106 Green Park',
            secondLine: '',
            city: 'Reading',
            county: 'Berkshire',
            postcode: 'RG30 1PQ'
        };

        const invalidPhone05 = Object.assign({}, invalidPhone04);
        invalidPhone05.phone = '05635243526';

        const invalidPhone8 = Object.assign({}, invalidPhone04);
        invalidPhone8.phone = '88635243526';

        const invalidEmail = Object.assign({}, invalidPhone04);
        invalidEmail.phone = '07484372635';
        invalidEmail.email = 'nickwoodward';

        const existingEmail = Object.assign({}, invalidEmail);
        const { dataValues: { email } } = await Person.findByPk(1);
        existingEmail.email = email;

        const invalidTypes = {
            companyName: 1,
            firstName: 1,
            lastName: 1,
            position: 1,
            phone: 1,
            email: 1,
            firstLine: 1,
            secondLine: 1,
            city: 1,
            county: 1,
            postcode: 1
        };

        return Promise.all([
            // Test range limits
            requester.post('/admin/create/company').send(minLimit),
            requester.post('/admin/create/company').send(maxLimit),
            requester.post('/admin/create/company').send(invalidPhone04),
            requester.post('/admin/create/company').send(invalidPhone05),
            requester.post('/admin/create/company').send(invalidPhone8),
            requester.post('/admin/create/company').send(invalidTypes),
            requester.post('/admin/create/company').send(invalidEmail),
            requester.post('/admin/create/company').send(existingEmail)

        ]).then(responses => {
            // NB: errors.array({ onlyFirstError: true });
            // Error if these *aren't* present. Additional errors will not cause the test to fail
            const expectedLimitErrors = [
                { param: 'companyName', msg: 'Enter a company name between 1 and 50 characters' },
                { param: 'firstName', msg: 'Enter a first name between 2 and 50 characters' },
                { param: 'lastName', msg: 'Enter a last name between 2 and 50 characters' },
                { param: 'phone', msg: 'Must be between 9 and 12 characters' },
                { param: 'email', msg: 'Please enter an email between 4 and 50 characters' },
                { param: 'position', msg: 'Enter a last name between 2 and 50 characters' },
                { param: 'firstLine', msg: 'Please enter a value between 1 and 50 characters' },
                { param: 'secondLine', msg: 'Please enter a value between 2 and 50 characters' },
                { param: 'city', msg: 'Please enter a value between 3 and 60 characters' },
                { param: 'county', msg: 'Please enter a county between 2 and 50 characters' },
                { param: 'postcode', msg: 'Please enter a postcode between 5 and 8 characters' }
            ];

            const expectedPhoneError = [{ param: 'phone', msg: 'Please enter a valid UK phone number' }];

            const expectedTypeErrors = Object.keys(invalidTypes).map(key => {
                return { param: `${key}`, msg: 'Invalid characters, please use letters and numbers only' };
            });

            const expectedEmailError = [{ param: 'email', msg: 'Please enter a valid email address' }];
            const expectedExistingEmailError = [{ param: 'email', msg: 'Email already exists' }];

            // Validation failed
            expect(responses[0].status).to.be.equal(422);
            expect(responses[0].body.error).to.include.deep.members(expectedLimitErrors);

            expect(responses[1].status).to.be.equal(422);
            expect(responses[1].body.error).to.include.deep.members(expectedLimitErrors);

            expect(responses[2].status).to.be.equal(422);
            expect(responses[2].body.error).to.be.deep.equal(expectedPhoneError);

            expect(responses[3].status).to.be.equal(422);
            expect(responses[3].body.error).to.be.deep.equal(expectedPhoneError);

            expect(responses[4].status).to.be.equal(422);
            expect(responses[4].body.error).to.be.deep.equal(expectedPhoneError);

            expect(responses[5].status).to.be.equal(422);
            expect(responses[5].body.error).to.include.deep.equal(expectedTypeErrors);

            expect(responses[6].status).to.be.equal(422);
            expect(responses[6].body.error).to.include.deep.equal(expectedEmailError);

            expect(responses[7].status).to.be.equal(422);
            expect(responses[7].body.error).to.include.deep.equal(expectedExistingEmailError);

        })
        .then(() => requester.close())
        .catch(err => {
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

        // Parameter with a space *NB: not falsey, should fail
        // `.optional({ checkFalsy: true })`

        const secondLineSpace = Object.assign({}, secondLineEmpty);
        secondLineSpace.secondLine = ' ';
        secondLineSpace.email = 'test@test1.com';

        return Promise.all([
            requester.post('/admin/create/company').send(secondLineEmpty),
            requester.post('/admin/create/company').send(secondLineMissing),
            requester.post('/admin/create/company').send(secondLineSpace),

        ]).then(responses => {

            expect(responses[0].status).to.equal(201);
            expect(responses[1].status).to.equal(201);
            // ' ' is not falsey, should fail validation
            expect(responses[2].status).to.equal(422);

            expect(responses[0].body.company.title).to.equal('Test Company');
            expect(responses[1].body.company.title).to.equal('Test Company');
            expect(responses[2].body.error[0]).to.be.deep.equal({
                param: 'secondLine',
                msg: 'Please enter a value between 2 and 50 characters'
            });

            requester.close();
        }).catch(err => { throw err });
    });

    it('should not create the Company if the Person creation fails', async() => {

        const testCompany =   {
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

        const req = { body: { ...testCompany } };

        // Stub out Person.create and reject it
        sinon.stub(Person, 'create');
        Person.create.rejects();

        const error = await adminController.createCompany(req, {}, () => {});

        // Company should not exist
        const result = await Company.findOne({ where: { name: 'ConferencePlatform' } });

        expect(error).to.be.an('error');
        expect(error.statusCode).to.be.equal(500);
        expect(result).to.be.null;
    });

    it("should not create the Person, Contact or Company if the Address creation fails", async () => {
        const testCompany = {
            companyName: "ConferencePlatform",
            firstName: "Dominic",
            lastName: "Rumsey",
            position: "CEO",
            phone: "07635243526",
            email: "dr@conferenceplatform.com",
            firstLine: "106 Green Park",
            secondLine: "",
            city: "Reading",
            county: "Berkshire",
            postcode: "RG30 1PQ",
        };

        const req = { body: { ...testCompany } };

        // Stub out Address.create and reject it
        sinon.stub(Address, "create");
        Address.create.rejects();

        const error = await adminController.createCompany(req, {}, () => {});

        // Company should not exist
        const company = await Company.findOne({
            where: { name: testCompany.companyName },
        });
        // Person should not exist
        const person = await Person.findOne({
            where: {
                [Op.and]: [
                    { firstName: testCompany.firstName },
                    { lastName: testCompany.lastName },
                    { email: testCompany.email },
                ],
            },
        });
        // Contact should not exist
        const contact = await Contact.findOne({
            where: { companyId: numOfTestCompanies + 1 }
        });

        expect(error).to.be.an("error");
        expect(error.statusCode).to.be.eql(500);
        expect(company).to.be.null;
        expect(person).to.be.null;
        expect(contact).to.be.null;
    });

    it('should not create the Address, Person, Contact and Company if adding the Person as a Contact fails', async() => {
        const testCompany =   {
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

        sinon.stub(Company.prototype, 'addPeople');
        Company.prototype.addPeople.rejects();

        const req = { body: { ...testCompany } };

        const result = await adminController.createCompany(req, {}, () => {});

        const address = await Address.findOne({ where: {
                [Op.and]: [
                    { firstLine: testCompany.firstLine },
                    { postcode: testCompany.postcode }
                ]
            }
        });
        const numOfCompanyAddresses = await CompanyAddress.count();

        // Company should not exist
        const company = await Company.findOne({
            where: { name: testCompany.companyName },
        });
        // Person should not exist
        const person = await Person.findOne({
            where: {
                [Op.and]: [
                    { firstName: testCompany.firstName },
                    { lastName: testCompany.lastName },
                    { email: testCompany.email },
                ],
            },
        });
        // Contact should not exist
        const contact = await Contact.findOne({
            where: { companyId: numOfTestCompanies + 1 }
        });

        expect(result).to.be.an('error');
        expect(result.statusCode).to.be.equal(500);

        expect(address).to.be.null;
        expect(contact).to.be.null;
        expect(person).to.be.null;
        expect(company).to.be.null;
        expect(numOfCompanyAddresses).to.be.equal(numOfTestCompanyAddresses);
    });

    it('should not add the Person, create the Person/Contact, or create the Address and Company if adding the Address fails', async() => {
        const testCompany =   {
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

        sinon.stub(Company.prototype, 'addPeople');
        Company.prototype.addPeople.rejects();

        const req = { body: { ...testCompany } };

        const result = await adminController.createCompany(req, {}, () => {});

        const address = await Address.findOne({ where: {
                [Op.and]: [
                    { firstLine: testCompany.firstLine },
                    { postcode: testCompany.postcode }
                ]
            }
        });
        const numOfCompanyAddresses = await CompanyAddress.count();

        const contact = await Contact.findOne({
            where: { companyId: numOfTestCompanies + 1 }
        });
        const person = await Person.findOne({
            where: { 
                [Op.and]: [
                    { firstName: testCompany.firstName },
                    { lastName: testCompany.lastName },
                    { email: testCompany.email }
                ]
            }
        });
        const company = await Company.findOne({
            where: { name: testCompany.companyName }
        });

        expect(result).to.be.an('error');
        expect(result.statusCode).to.be.equal(500);

        expect(address).to.be.null;
        expect(contact).to.be.null;
        expect(person).to.be.null;       
        expect(company).to.be.null;

        expect(numOfCompanyAddresses).to.be.equal(numOfTestCompanyAddresses);
    });

    // DELETE COMPANY
    it('should return 200 when a company is deleted', async function() {
        const randomId = Math.ceil(Math.random() * numOfTestCompanies);

        const req = { params: { id: randomId } };
        const res = {
            statusCode: 500,
            msg: '',
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.msg = data.msg;
            }
        };

        console.log(randomId);
        await adminController.deleteCompany(req, res, () => {});
       

        expect(res.statusCode).to.be.equal(200);
        expect(res.msg).to.be.equal('Company Deleted');
    });

    it('should return 422 when a company is not found', async function() {
        const id = numOfTestCompanies +1;

        const req = { params: { id: id} };

        const error = await adminController.deleteCompany(req, {}, () => {});
        expect(error.statusCode).to.be.equal(422);
        expect(error.message).to.be.equal('Cannot find Company');
    });

    it('should return 500 and rollback if a contact for that company is not found', async function() {
        sinon.stub(Company.prototype, 'getPeople');
        Company.prototype.getPeople.resolves();

        const error = await adminController.deleteCompany({ params: {id:1} }, {}, () => {});

        const company = await Company.findByPk(1);

        expect(error).to.be.an('error');
        expect(error.message).to.be.equal('Error deleting contacts');
        expect(error.statusCode).to.be.equal(500);
        expect(company).to.exist;
        expect(company.dataValues).to.have.property('id', 1);
    });

    it('should return 500 and rollback if there is an error deleting related Contacts', async function() {
        const randomId = Math.ceil(Math.random() * numOfTestCompanies);

        sinon.stub(Person, 'destroy');
        Person.destroy.rejects();

        const req = { params: { id: randomId } };

        const error = await adminController.deleteCompany(req, {}, () => {});

        const res = { 
            statusCode: 0,
            msg: '',
            company: {},
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.msg = data.msg;
                this.company = data.company;
            }
        };

        const company = await adminController.getCompany(req, res, () => {});

        expect(error.statusCode).to.be.equal(500);
        expect(error).to.be.an('error');
        expect(company).to.exist;
        expect(res.statusCode).to.be.equal(200);
        expect(company.dataValues.id).to.be.equal(randomId);
    });

    it('should return 500 and rollback deleting Contacts and Company if error getting Jobs', async function() {
        const randomId = Math.ceil(Math.random() * numOfTestCompanies);

        sinon.stub(Company.prototype, 'getJobs');
        Company.prototype.getJobs.rejects();

        const numContactsBefore = await Contact.count({ where: { companyId: randomId } });

        const req = { params: { id: randomId } };
        const error = await adminController.deleteCompany(req, {}, () => {});

        // Check company exists after rollback
        const company = await Company.findByPk(randomId);
        const numContactsAfter = await Contact.count({ where: { companyId: randomId } });

        expect(error).to.be.an('error');
        expect(error.statusCode).to.be.equal(500);
        expect(company).to.exist;
        expect(company.dataValues).to.have.property('id', randomId);
        expect(numContactsBefore).to.be.equal(numContactsAfter);
    });

    // it('should return 500 and rollback');

    it('should remove the company with a given id from the database', async function() {
        const randomId = Math.ceil(Math.random() * numOfTestCompanies);

        const req = { params: { id: randomId } };
        const res = {
            statusCode: 500,
            msg: '',
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.msg = data.msg;
            }
        };
        const existingCompany = await Company.findByPk(randomId);

        await adminController.deleteCompany(req, res, () => {});

        const deletedCompany = await Company.findByPk(randomId);

        expect(existingCompany).to.exist;
        expect(deletedCompany).to.be.null;
        expect(res.statusCode).to.be.equal(200);
        expect(res.msg).to.be.equal('Company Deleted');
    });


});

