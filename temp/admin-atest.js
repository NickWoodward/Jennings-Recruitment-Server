process.env.NODE_ENV = 'testing';
require('dotenv').config();

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');


const sequelize = require('../util/database');
const { createDatabaseAssociations, populateDB } = require('../util/dbUtils');

const Company = require('../models/company');
const Person = require('../models/person');
const Address = require('../models/address');


const adminController = require('../controllers/admin');

// let connection;

before(async function() {
    console.log('-------------------------------- BEFORE ALL TESTS ----------------------------------------');

    await createDatabaseAssociations();


});

beforeEach(async function() {
    try {
        console.log('-------------------------------- BEFORE EACH TEST ----------------------------------------');

    await sequelize.sync({ force: true });
    await populateDB();


    } catch(err) {
        console.log(err);
        throw err;
    }
});

// after(async function() {
//     // await connection.close(); 
// });

describe('DEBUGGING TESTS', function() {


    afterEach(async () => {
        console.log('-------------------------------- AFTER EACH TEST ----------------------------------------');
    });

    it('should get a company with the given id', async function() {
        const req = { params: { id: 1 } };
        const res = { 
            statusCode: 500,
            company: {},
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.company = data.company;
                return;
            }
        };
        await adminController.getCompany(req, res, () => {});
        expect(res.statusCode).to.be.equal(200);
        expect(res.company).to.have.property('id', 1);

    });

    
    it("test", async function() {
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

        // sinon.stub(Company.prototype, 'addPeople');
        // Company.prototype.addPeople.rejects();

        const res = {
            statusCode: 500,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                return;
            }
        };
        console.log(`START TRANSACTION --------------------------------`);
        await adminController.testFunction({}, res, () => {});
        expect(res.statusCode).to.be.equal(201);
    });

    it("test1", async () => {
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

        // sinon.stub(Company.prototype, 'addAddresses');
        // Company.prototype.addAddresses.rejects();

        const result = await adminController.testFunction({
            body: { ...testCompany },
        }, {}, () => {});


    });

    
    it('should not create the Address if adding the Person as a Contact fails', async() => {
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

        // sinon.stub(Company.prototype, 'addPeople');
        // Company.prototype.addPeople.rejects();

        const req = { body: { ...testCompany } };

        const result = await adminController.createCompany(req, {}, () => {});

        // const address = await Address.findOne({ where: {
        //         [Op.and]: [
        //             { firstLine: testCompany.firstLine },
        //             { postcode: testCompany.postcode }
        //         ]
        //     }
        // });
        // const numOfCompanyAddresses = await CompanyAddress.count();

        // expect(address).to.be.null;
        expect(result).to.be.an('error');
        expect(result.statusCode).to.be.equal(500);
        // expect(numOfCompanyAddresses).to.be.equal(numOfTestCompanyAddresses);
    
    });




    it("hello", async function() {
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

        // sinon.stub(Company.prototype, 'addPeople');
        // Company.prototype.addPeople.rejects();

        const res = {
            statusCode: 500,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                return;
            }
        };

        await adminController.testFunction({}, res, () => {});
        expect(res.statusCode).to.be.equal(201);
    });



});



