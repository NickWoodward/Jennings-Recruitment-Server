//@TODO: Combine this with the non testing database file

const Job = require('../models/job');
const Person = require('../models/person');
const Company = require('../models/company');
const Contact = require('../models/contacts');
const Applicant = require('../models/applicant');
const Application = require('../models/application');
const Address = require('../models/address');
const CompanyAddress = require('../models/companyAddress');

const dbName = process.env.NODE_ENV !== 'testing'?  process.env.DB_DATABASE : process.env.DB_TEST_DATABASE;
const logging = process.env.NODE_ENV === 'testing'? false:true;

exports.createDBConnection = () => {
    return new Sequelize(dbName, process.env.DB_USER, process.env.DB_PASSWORD, {
        dialect: 'mysql', 
        host: process.env.DB_HOST,
        logging: msg => { if(logging) console.log(msg) }
    });
};

exports.createDatabaseAssociations = () => {
    console.log('*************************************');
    // Companies 1:M Jobs
    Company.hasMany(Job, { foreignKey: { name: 'companyId', allowNull: false } });
    Job.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: false } });

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
};

exports.populateDB = async() => {
    console.log('Populating DB');
    try {
        // Companies
        const company1 = await Company.create({ name: 'jrs' });
        const company2 = await Company.create({ name: 'woolworths' });
        const company3 = await Company.create({ name: 'node' });
        const company4 = await Company.create({ name: 'dell' });

        // Jobs
        const job1 = await Job.create({ title: 'ceo of jrs', wage: '80000', location: 'bristol', description: 'the ceo of a recruitment firm', featured: true, companyId: company1.id });
        const job2 = await Job.create({ title: 'head of hr for jrs', wage: '60000', location: 'bristol', description: 'hr head in a recruitment firm', featured: false, companyId: company1.id });
        const job3 = await Job.create({ title: 'ceo of woolworths', wage: '90000', location: 'swindon', description: 'the ceo of a doomed firm', featured: true, companyId: company2.id });
        const job4 = await Job.create({ title: 'head of hr for woolworths', wage: '50000', location: 'swindon', description: 'hr head in a doomed firm', featured: false, companyId: company2.id });

        // Addresses
        const address1 = await Address.create({ firstLine: 'kemp house', secondLine: '152 city road', city: 'bristol', county: 'bristol', postcode: 'bs15 1pq' });
        const address2 = await Address.create({ firstLine: 'forge house', secondLine: '', city: 'swindon', county: 'wiltshire', postcode: 'sn12 5ek' });
        const address3 = await Address.create({ firstLine: '306 stonehill drive', secondLine: 'haversely', city: 'salisbury', county: 'wiltshire', postcode: 'sn12 5ek' });
        const address4 = await Address.create({ firstLine: '306 city road', secondLine: '', city: 'london', county: 'greater london', postcode: 'ec1v 2nx' });

        company1.addAddress(address1);
        company1.addAddress(address4);
        company2.addAddress(address2);
        company2.addAddress(address3);

        // // Applicants
        const person1 = await Person.create({ firstName: 'nick', lastName: 'woodward', phone: '074843732635', email: 'nickwoodward@gmail.com' });
        const applicant1 = await Applicant.create({ personId: person1.id, cvUrl: 'thisismycv.doc' });
        const person2 = await Person.create({ firstName: 'will', lastName: 'woodward', phone: '074843732635', email: 'willwoodward@gmail.com' });
        const applicant2 = await Applicant.create({ personId: person2.id });
        const person3 = await Person.create({ firstName: 'jeff', lastName: 'wode', phone: '074843732635', email: 'wode@gmail.com' });
        const applicant3 = await Applicant.create({ personId: person3.id });

        await job1.addApplicant(applicant1);
        await job1.addApplicant(applicant2);
        await job1.addApplicant(applicant3);

        await job2.addApplicant(applicant1);
        await job2.addApplicant(applicant2);
        
        await job3.addApplicant(applicant3);

        await job4.addApplicant(applicant2);

        // Contacts
        const person4 = await Person.create({ firstName: 'jj', lastName: 'wode', phone: '074843732635', email: 'j@gmail.com' });
        const person5 = await Person.create({ firstName: 'steff', lastName: 'reed', phone: '074843732635', email: 'steff@gmail.com' });
        person4.addCompany(company1, { through: { position: 'ceo' } });
        person5.addCompany(company1, { through: { position: 'head of hr' } });

        const person6 = await Person.create({ firstName: 'dom', lastName: 'rumbo', phone: '074843732635', email: 'rumbo@gmail.com' });
        person6.addCompany(company2, { through: { position: 'boss' } });

        const person7 = await Person.create({ firstName: 'ruth', lastName: 'symonds', phone: '0736463748', email: 'ruth@gmail.com' });
        person7.addCompany(company3, { through: { position: 'head of gin' } });

        const person8 = await Person.create({ firstName: 'alex', lastName: 'may', phone: '0736463748', email: 'maylord@gmail.com' });
        const person9 = await Person.create({ firstName: 'john', lastName: 'gantlett', phone: '0736463748', email: 'ganty@gmail.com' });
        person8.addCompany(company4, { through: { position: 'nazmodan' } });
        person9.addCompany(company4, { through: { position: 'jester' } });
    } catch(err) {
        console.log(err);
    }
};