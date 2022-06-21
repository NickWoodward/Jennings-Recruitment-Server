const chai = require('chai');
const expect = chai.expect;

const Applicant = require('../../../models/applicant');
const Person = require('../../../models/person');
const adminController = require('../../../controllers/admin');


describe('Admin Controller: Companies', function() {
    it.only('should return an array of applicants', async() => {
        const applicants = await Applicant.findAndCountAll();

        const req = { query: { } };
        const res = {
            statusCode: 500,
            applicants: [],
            applicantTotal: 0,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.applicants = data.applicants;
                this.applicantTotal = data.applicantTotal;
                return this;
            }
        };

        await adminController.getApplicants(req, res, ()=> {});

        expect(res.statusCode).to.be.equal(200);
        expect(res.applicants).to.have.lengthOf(applicants.rows.length)
    });

    it.only('should return an array of applicants with the first given element', async() => {
        // Create an applicant
        const applicant = await Applicant.create({
            cvUrl: 'cvUrlsu.txt',
            person: {
                firstName: 'firstName', 
                lastName: 'lastName',
                phone: 'phone',
                email: 'email'
            }
        }, { include: Person });

        const req = { query: { indexId: applicant.id } };
        const res = {
            statusCode: 500,
            applicants: [],
            applicantTotal: 0,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.applicants = data.applicants;
                this.applicantTotal = data.applicantTotal;
                return this;
            }
        };

        await adminController.getApplicants(req, res, ()=> {});

        expect(res.statusCode).to.be.equal(200);
        expect(res.applicants).to.be.an('array');
        expect(res.applicants[0].id).to.be.equal(applicant.id);
        expect(res.applicants[0].firstName).to.be.equal(applicant.person.firstName)
    })
})