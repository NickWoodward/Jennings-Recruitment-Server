
const chai = require('chai');
const expect = chai.expect;
const {Op} = require('sequelize');

const Company = require('../../../models/company');
const Contact = require('../../../models/contact');
const Person = require('../../../models/person');
const Applicant = require('../../../models/applicant');
const Address = require('../../../models/address');
const Job = require('../../../models/job');
const Application = require('../../../models/application');

const adminController = require('../../../controllers/admin');

// CompanyAddress is deleted
// Address is deleted
// Contact is deleted
// Person is deleted if not an applicant
// Jobs and applications are deleted - applicants are not

const NUM_TEST_COMPANIES = 4;
const COMPANY_WITH_JOB_AND_APPLICATION = 2;

describe('Admin Controller: Companies', function() {
    ///// DELETE COMPANIES /////
    it('should delete the company with the given id', async() => {
        const randomId = Math.ceil(Math.random() * NUM_TEST_COMPANIES);

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
    })

    it('should delete the associated Addresses', async() => {
        const randomId = Math.ceil(Math.random() * NUM_TEST_COMPANIES);

        const company = await Company.findByPk(randomId, { 
            include: [
                {
                    model: Address
                }
            ]
        });

        // Add another address
        await company.addAddress(await Address.create({firstLine:'test', secondLine:'test', city:'test', county:'test', postcode:'test', companyId: company.id}));
        await company.reload();
        console.dir(company.toJSON(), {depth: 1});

        // Get the address ids
        const addressIds = company.addresses.map(address => address.dataValues.id);
        
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
                return this;
            } 
        };

        await adminController.deleteCompany(req, res, ()=>{});

        const addresses = await Address.findAll({
            where: { 
                id: { [Op.or]: addressIds }
            }
        });

        // Check there were addresses initially
        expect(company.addresses.length).to.not.equal(0);
        // Check no addresses match the companyId
        expect(addresses.length).to.equal(0);
        // Check no rows in the join table match the companyId
        expect(addresses.length).to.equal(0);
    })

    it('should delete the contacts and underlying people, unless they are also an applicant', async() => {
        const randomId = Math.ceil(Math.random() * NUM_TEST_COMPANIES);

        const company = await Company.findByPk(randomId, { include: [ { model: Contact, include: Person } ] });

        // Make the first contact apply for a job
        const applicant = await Applicant.create({ personId: company.contacts[0].person.id, cvUrl: 'fake.pdf' });

        let results;
        // Make sure there are 3 contacts, so can confirm it's deleting multiple entries, but not the applicant
        if(company.contacts.length < 2) {
            results = await Promise.all([
                Contact.create({
                    position: 'hr', 
                    companyId: randomId,
                    person: { firstName: 'contact2', lastName: 'contact2', phone: '07484321878', email: 'asd@asd.com' }
                }, { include: [Person] }),
                Contact.create({
                    position: 'ceo', 
                    companyId: randomId,
                    person: { firstName: 'contact3', lastName: 'contact3', phone: '08484321878', email: 'ajj@asd.com' }
                }, { include: [Person] })
            ]);
        } else if (company.contacts.length < 3) {
            results = [
                await Contact.create({
                    position: 'hr', 
                    companyId: randomId,
                    person: { firstName: 'contact3', lastName: 'contact3', phone: '07484321878', email: 'asd@aasdsd.com' }
                }, { include: [Person] }),
            ]
        }

        await company.reload();
        company.contacts.forEach(contact=>console.dir(contact.toJSON(), {depth: 1}))

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
                return this;
            }
        };

        // Delete the company
        await adminController.deleteCompany(req, res, ()=>{});

        // Should be null
        const contacts = await Contact.findAll({ where: { companyId: randomId } });
        // The applicant should still exist
        const person = await Person.findByPk(applicant.personId, {include: Contact});

        // Company.contacts should include the person (prior to deletion)
        expect(company.contacts.map(contact => contact.person.id)).to.include(person.id);

        // No contacts should have the deleted company id
        expect(contacts.length).to.be.equal(0);

        // The contact that was an applicant should still exist
        expect(person.id).to.be.equal(applicant.personId);

    });

    it('should delete the jobs associated with the company', async() => {
        const randomId = Math.ceil(Math.random() * NUM_TEST_COMPANIES);

        const company = await Company.findByPk(randomId, { include: [Job] });

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
                return this;
            }
        };

        await adminController.deleteCompany(req, res, ()=>{});

        const jobs = await Job.findAll({where:{companyId:randomId}});

        expect(jobs.length).to.be.equal(0);
        expect(res.statusCode).to.be.equal(200);
        expect(res.msg).to.be.equal('Company Deleted');
    });

    it('should delete the applications to the company jobs, but leave the applicant', async() => {
        // Picking a company with a job saves having to create applications, applicants, and people
        const companyId = COMPANY_WITH_JOB_AND_APPLICATION;

        // The company to delete
        const company = await Company.findByPk(companyId, {
            include: [
                {
                    model: Job,
                    include: Applicant
                }
            ]
        });

        // The jobs of the company to be deleted
        const jobIds = company.jobs.map(job => job.id);

        // The applications of the company to be deleted
        const applications = await Application.findAll({
            where: { jobId: {[Op.or]: jobIds} },
            include: Applicant
        });

        // These should be removed
        const applicationIds = applications.map(application => application.id);
        // These should remain
        const applicantIdsBefore = applications.map(application => application.applicant.id);

        const req = { params: { id: COMPANY_WITH_JOB_AND_APPLICATION } };
        const res = {
            statusCode: 500,
            msg: '',
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.msg = data.msg;
                return this;
            }
        };

        await adminController.deleteCompany(req, res, () => {});

        const results = await Promise.all([
            Application.findAll({where: { id: { [Op.or]: applicationIds } }}),
            Applicant.findAll({where: { id: { [Op.or]: applicantIdsBefore } }})
        ]);

        const applicantIdsAfter = results[1].map(applicant => applicant.id);

        // There should be applications prior to deletion
        expect(applicationIds).to.not.be.empty;
        // There should be no applications with those ids after company deletion
        expect(results[0]).to.be.an('array').that.is.empty;

        // There should be applicants before and after company deletion
        expect(applicantIdsAfter).to.deep.equals([...new Set(applicantIdsBefore)]);
    });

    ///// DELETE ADDRESSES /////
    it('should delete the address with the given id', async() => {
        const req = { params: { id } };
        const res = {
            
        };
    });


    // #TODO: Shouldn't let the last contact be deleted
    // #TODO: Shouldn't let the last address be deleted





    //////// END DELETE ////////
});




    // it('should return 200 when a company is deleted', async function() {
    //     const randomId = Math.ceil(Math.random() * NUM_TEST_COMPANIES);

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

        // it('should return 422 when a company is not found or a falsey value is returned', async function() {
    //     const id = NUM_TEST_COMPANIES +1;

    //     const req = { params: { id: id} };

    //     const error = await adminController.deleteCompany(req, {}, () => {});
    //     expect(error.statusCode).to.be.equal(422);
    //     expect(error.message).to.be.equal('Cannot find Company');
    // });
