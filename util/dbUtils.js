const Job = require('../models/job');
const Person = require('../models/person');
const Company = require('../models/company');
const Contact = require('../models/contacts');
const Applicant = require('../models/applicant');
const Application = require('../models/application');
const Address = require('../models/address');
const CompanyAddress = require('../models/companyAddress');

//@TODO: Check these foriegn keys are correct in both
exports.createDatabaseAssociations = () => {
    // Companies 1:M Jobs
    Company.hasMany(Job, { foreignKey: { name: 'companyId', allowNull: false} });
    Job.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: false} });

    // Address M:N Companies
    Company.belongsToMany(Address, { through: CompanyAddress });
    Address.belongsToMany(Company, { through: CompanyAddress });

    // Applicant is a subtype of Person
    Person.hasOne(Applicant, { foreignKey: { name: 'personId', allowNull: false, unique: true } });
    Applicant.belongsTo(Person, { foreignKey: { name: 'personId', allowNull: false, unique: true } });

    // Applicants M:N Jobs (through Application)
    Applicant.belongsToMany(Job, { through: Application });
    Job.belongsToMany(Applicant, { through: Application });

    // Person M:N Company (through Contact)
    Person.belongsToMany(Company, { through: Contact });
    Company.belongsToMany(Person, { through: Contact });
}

exports.populateDB = async() => {
    // Companies
    const company1 = await Company.create({ name: 'Jrs' });
    const company2 = await Company.create({ name: 'Woolworths' });
    const company3 = await Company.create({ name: 'Node' });
    const company4 = await Company.create({ name: 'Dell' });

    // Jobs
    const job1 = await Job.create({ title: 'IP Counsel', wage: '80000', location: 'Bristol', description: 'An international charity is looking for a Legal Counsel to cover a maternity leave commencing this month.', featured: true, jobType: 'Permanent', position: 'In House', pqe: 4, companyId: company1.id });
    const job2 = await Job.create({ title: 'Head of Legal', wage: '60000', location: 'Bristol', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 10, companyId: company1.id });
    const job3 = await Job.create({ title: 'Junior Legal Counsel', wage: '90000', location: 'Swindon', description: 'This is a great opportunity for a corporate/generalist lawyer to work for an entrepreneurial, growing and leading business across Europe.', featured: true, jobType: 'Interim', position: 'In House', pqe: 2, companyId: company2.id });
    const job4 = await Job.create({ title: 'Legal Counsel', wage: '50000', location: 'Swindon', description: 'A fast-growing gaming and sports betting company based in Central London is looking for an ambitious commercial lawyer to join their growing team as Legal Counsel.', featured: false, jobType: 'Interim', position: 'In House', pqe: 5, companyId: company2.id });

    // Addresses
    const address1 = await Address.create({ firstLine: 'Kemp House', secondLine: '152 city road', city: 'Bristol', county: 'Bristol', postcode: 'BS15 1PQ' });
    const address2 = await Address.create({ firstLine: 'Forge House', secondLine: '', city: 'Swindon', county: 'Wiltshire', postcode: 'SN12 5EK' });
    const address3 = await Address.create({ firstLine: '306 Stonehill Drive', secondLine: 'Haversely', city: 'Salisbury', county: 'Wiltshire', postcode: 'SN12 5EK' });
    const address4 = await Address.create({ firstLine: '306 City Road', secondLine: '', city: 'London', county: 'Greater London', postcode: 'EC1V 2NX' });

    await company1.addAddress(address1);
    await company2.addAddress(address4);
    await company3.addAddress(address2);
    await company4.addAddress(address3);

    // // Applicants
    const person1 = await Person.create({ firstName: 'Nick', lastName: 'Woodward', phone: '074843732635', email: 'nickwoodward@gmail.com' });
    const applicant1 = await Applicant.create({ personId: person1.id, cvUrl: 'thisismycv.doc' });
    const person2 = await Person.create({ firstName: 'Will', lastName: 'Woodward', phone: '074843732635', email: 'willwoodward@gmail.com' });
    const applicant2 = await Applicant.create({ personId: person2.id });
    const person3 = await Person.create({ firstName: 'Jeff', lastName: 'Wode', phone: '074843732635', email: 'wode@gmail.com' });
    const applicant3 = await Applicant.create({ personId: person3.id });

    await job1.addApplicant(applicant1);
    await job1.addApplicant(applicant2);
    await job1.addApplicant(applicant3);

    await job2.addApplicant(applicant1);
    await job2.addApplicant(applicant2);
    
    await job3.addApplicant(applicant3);

    await job4.addApplicant(applicant2);

    // Contacts
    const person4 = await Person.create({ firstName: 'JJ', lastName: 'Jennings', phone: '074843732635', email: 'j@gmail.com' });
    const person5 = await Person.create({ firstName: 'Steff', lastName: 'Reed', phone: '074843732635', email: 'steff@gmail.com' });
    await person4.addCompany(company1, { through: { position: 'CEO' } });
    await person5.addCompany(company1, { through: { position: 'Head of HR' } });

    const person6 = await Person.create({ firstName: 'Dom', lastName: 'Rumbo', phone: '074843732635', email: 'rumbo@gmail.com' });
    await person6.addCompany(company2, { through: { position: 'HR' } });

    const person7 = await Person.create({ firstName: 'Ruth', lastName: 'Symonds', phone: '0736463748', email: 'ruth@gmail.com' });
    await person7.addCompany(company3, { through: { position: 'Head of Gin' } });

    const person8 = await Person.create({ firstName: 'Alex', lastName: 'May', phone: '0736463748', email: 'maylord@gmail.com' });
    const person9 = await Person.create({ firstName: 'John', lastName: 'Gantlett', phone: '0736463748', email: 'ganty@gmail.com' });
    await person8.addCompany(company4, { through: { position: 'Head of HR' } });
    await person9.addCompany(company4, { through: { position: 'HR' } });
}