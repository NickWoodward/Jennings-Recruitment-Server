const Job = require('../models/job');
const Person = require('../models/person');
const Company = require('../models/company');
const Contact = require('../models/contact');
const Applicant = require('../models/applicant');
const Application = require('../models/application');
const Address = require('../models/address');
const CompanyAddress = require('../models/companyAddress');


//@TODO: Check these foriegn keys are correct in both
exports.createDatabaseAssociations = () => {
    // console.log('Creating associations');

    // Companies 1:M Jobs
    Company.hasMany(Job, { foreignKey: { name: 'companyId', allowNull: false} });
    Job.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: false} });

    // // Address M:N Companies
    // Company.belongsToMany(Address, { through: CompanyAddress })
    // Address.belongsToMany(Company, { through: CompanyAddress });

    // Companies 1:M Address
    Company.hasMany(Address, { foreignKey: { name: 'companyId', allowNull: true }, onDelete: 'CASCADE' });
    Address.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: true }, onDelete: 'CASCADE' });

    Address.belongsTo(Person, { foreignKey: { name: 'personId', allowNull: true }, onDelete: 'CASCADE' });
    Person.hasMany(Address, { foreignKey: { name: 'personId', allowNull: true }, onDelete: 'CASCADE' });

    // Applicant is a subtype of Person
    Person.hasOne(Applicant, { foreignKey: { name: 'personId', allowNull: false, unique: true } });
    Applicant.belongsTo(Person, { foreignKey: { name: 'personId', allowNull: false, unique: true } });

    // Applicants M:N Jobs (through Application)
    Applicant.belongsToMany(Job, { through: Application });
    Job.belongsToMany(Applicant, { through: Application });

    // Applicant.hasMany(Application, { foreignKey: 'applicantId', onDelete: 'CASCADE' });
    // Job.belongsTo(Applicant, { foreignKey: 'applicantId', onDelete: 'CASCADE' });

    // Set associations so the Application table can be queried directly
    Application.belongsTo(Job, { foreignKey: { name: 'jobId' }});
    Application.belongsTo(Applicant, { foreignKey: { name: 'applicantId' } });

    // // // Person M:N Company (through Contact)
    // Person.belongsToMany(Company, { through: Contact });
    // Company.belongsToMany(Person, { through: Contact });

    Company.hasMany(Contact, { onDelete: 'CASCADE' });
    Contact.belongsTo(Company);

    Contact.belongsTo(Person);
    Person.hasMany(Contact)
    // ****
}

exports.populateDB = async() => {

    const results = await Promise.all([
        await Company.create({ name: 'Jrs' }),
        await Company.create({ name: 'Woolworths' }),
        await Company.create({ name: 'Node' }),
        await Company.create({ name: 'Dell' }),
        await Company.create({ name: 'London Fields' }),
        await Company.create({ name: 'Sky' }),
        await Company.create({ name: 'Technics' }),
        await Company.create({ name: 'Ride' }),
        await Company.create({ name: 'Anker' }),
    ]);

    const [ company1, company2, company3, company4, company5, company6, company7, company8, company9 ] = results;

    // // Companies
    // const company1 = await Company.create({ name: 'Jrs' });
    // const company2 = await Company.create({ name: 'Woolworths' });
    // const company3 = await Company.create({ name: 'Node' });
    // const company4 = await Company.create({ name: 'Dell' });
    // const company5 = await Company.create({ name: 'London Fields' });
    // const company6 = await Company.create({ name: 'Sky' });
    // const company7 = await Company.create({ name: 'Technics' });
    // const company8 = await Company.create({ name: 'Ride' });
    // const company9 = await Company.create({ name: 'Anker' });

    // Jobs
    const job1 = await Job.create({ title: 'IP Counsel', wage: '80000', location: 'Bristol', description: 'An international charity is looking for a Legal Counsel to cover a maternity leave commencing this month.', featured: true, jobType: 'Permanent', position: 'In House', pqe: 4, companyId: company1.id });
    const job2 = await Job.create({ title: 'Head of Legal', wage: '60000', location: 'Bristol', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 10, companyId: company1.id });
    const job3 = await Job.create({ title: 'Junior Legal Counsel', wage: '90000', location: 'Swindon', description: 'This is a great opportunity for a corporate/generalist lawyer to work for an entrepreneurial, growing and leading business across Europe.', featured: true, jobType: 'Interim', position: 'In House', pqe: 2, companyId: company2.id });
    const job4 = await Job.create({ title: 'Legal Counsel', wage: '50000', location: 'Swindon', description: 'A fast-growing gaming and sports betting company based in Central London is looking for an ambitious commercial lawyer to join their growing team as Legal Counsel.', featured: false, jobType: 'Interim', position: 'In House', pqe: 5, companyId: company2.id });
    const job5 = await Job.create({ title: 'Head of HR', wage: '60000', location: 'Reading', description: 'A fast-growing gaming and sports betting company based in Central London is looking for an ambitious commercial lawyer to join their growing team as Legal Counsel.', featured: false, jobType: 'Interim', position: 'In House', pqe: 5, companyId: company2.id });
    const job6 = await Job.create({ title: 'Head of Legal', wage: '80000', location: 'Glasgow', description: 'A fast-growing gaming and sports betting company based in Central London is looking for an ambitious commercial lawyer to join their growing team as Legal Counsel.', featured: true, jobType: 'Interim', position: 'In House', pqe: 5, companyId: company8.id });
    const job7 = await Job.create({ title: 'Junior Legal Counsel', wage: '60000', location: 'Bristol', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 10, companyId: company9.id });
    const job8 = await Job.create({ title: 'IP Counsel', wage: '100000', location: 'Reading', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 10, companyId: company6.id });
    const job9 = await Job.create({ title: 'Legal Counsel', wage: '60000', location: 'Bristol', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 10, companyId: company4.id });
    const job10 = await Job.create({ title: 'Personal Legal Assistant', wage: '40000', location: 'Exeter', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 4, companyId: company7.id });
    const job11 = await Job.create({ title: 'Head of Legal', wage: '60000', location: 'Oxford', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 8, companyId: company3.id });
    const job12 = await Job.create({ title: 'Head of HR', wage: '60000', location: 'Reading', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 8, companyId: company5.id });
    const job13 = await Job.create({ title: 'Junior Legal Counsel', wage: '50000', location: 'London', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 8, companyId: company4.id });
    const job14 = await Job.create({ title: 'Legal Counsel', wage: '30000', location: 'Oxford', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 8, companyId: company6.id });
    const job15 = await Job.create({ title: 'IP Counsel', wage: '40000', location: 'Leeds', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 8, companyId: company8.id });
    const job16 = await Job.create({ title: 'Head of HR', wage: '50000', location: 'Cardiff', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 8, companyId: company9.id });
    const job17 = await Job.create({ title: 'Head of Legal', wage: '60000', location: 'Exeter', description: "Reporting directly into the Associate General Counsel for UK Home you will have a key role in driving the realisation of UK Home and the wider legal function's objectives, managing commercial and regulatory risk on a day to day basis and leading, motivating and developing the team of 4 lawyers.", featured: false, jobType: 'Permanent', position: 'Private Practice', pqe: 8, companyId: company3.id });



    // Addresses
    await Address.create({ firstLine: 'Kemp House', secondLine: '152 city road', city: 'Bristol', county: 'Bristol', postcode: 'BS15 1PQ', companyId: 1 });
    await Address.create({ firstLine: 'Forge House', secondLine: '', city: 'Swindon', county: 'Wiltshire', postcode: 'SN12 5EK', companyId: 3 });
    await Address.create({ firstLine: '306 Stonehill Drive', secondLine: 'Haversely', city: 'Salisbury', county: 'Wiltshire', postcode: 'SN12 5EK', companyId: 4 });
    await Address.create({ firstLine: '306 City Road', secondLine: '', city: 'London', county: 'Greater London', postcode: 'EC1V 2NX', companyId: 2 });
    await Address.create({ firstLine: '62 Edinburgh Road', secondLine: '', city: 'Congleton', county: 'Cheshire', postcode: 'CW12 2NE', companyId: 5 });
    await Address.create({ firstLine: '161 Queens Way', secondLine: '', city: 'Swindon', county: 'Wiltshire', postcode: 'SN8 3PE', companyId: 6 });
    await Address.create({ firstLine: '30 Churchill Drive', secondLine: '', city: 'Birmingham', county: 'West Midlands', postcode: 'B12 7PR', companyId: 7 });
    await Address.create({ firstLine: '11 Redhill Drive', secondLine: '', city: 'Birmingham', county: 'West Midlands', postcode: 'B12 8ER', companyId: 8 });
    await Address.create({ firstLine: '21 Lenton Close', secondLine: '', city: 'Reading', county: 'Berkshire', postcode: 'RG1 8ER', companyId: 9 });






    // await company1.addAddress(address1);
    // await company2.addAddress(address4);
    // await company3.addAddress(address2);
    // await company4.addAddress(address3);

    // // Applicants
    const person1 = await Person.create({ firstName: 'Nick', lastName: 'Woodward', phone: '074843732635', email: 'nickwoodward@gmail.com' });
    const applicant1 = await Applicant.create({ personId: person1.id, cvUrl: 'thisismycv.doc' });
    const person2 = await Person.create({ firstName: 'Will', lastName: 'Woodward', phone: '074843732635', email: 'willwoodward@gmail.com' });
    const applicant2 = await Applicant.create({ personId: person2.id });
    const person3 = await Person.create({ firstName: 'Jeff', lastName: 'Wode', phone: '074843732635', email: 'wode@gmail.com' });
    const applicant3 = await Applicant.create({ personId: person3.id });

    const address5 = await Address.create({ firstLine: '35 Pevey Road', secondLine: '', city: 'Leeds', county: 'West Yorkshire', postcode: 'LS6 2NX', personId: 1 });
    const address6 = await Address.create({ firstLine: '97 Donnington Road', secondLine: '', city: 'Reading', county: 'Berkshire', postcode: 'RG1 5NE', personId: 2 });
    const address7 = await Address.create({ firstLine: '306 Rosey Lane', secondLine: '', city: 'Marlborough', county: 'Wiltshire', postcode: 'SN9 8PR', personId: 3 });


    await job1.addApplicant(applicant1);
    await job1.addApplicant(applicant2);
    await job1.addApplicant(applicant3);

    await job2.addApplicant(applicant1);
    await job2.addApplicant(applicant2);
    await job2.addApplicant(applicant3);

    await job3.addApplicant(applicant3);
    await job3.addApplicant(applicant1);
    await job3.addApplicant(applicant2);

    await job4.addApplicant(applicant2);
    await job4.addApplicant(applicant1);
    await job4.addApplicant(applicant3);

    // const application1 = await Application.create();
    // application1.setApplicant(applicant1);
    // application1.setJob(job1);

    // Contacts
    const person4 = await Person.create({ firstName: 'JJ', lastName: 'Jennings', phone: '074843732635', email: 'j@gmail.com' });
    const person5 = await Person.create({ firstName: 'Steff', lastName: 'Reed', phone: '074843732635', email: 'steff@gmail.com' });

    // If using a many to many relationship
    // await person4.addCompany(company1, { through: { position: 'CEO' } });
    // await person5.addCompany(company1, { through: { position: 'Head of HR' } });

    // Using a manual join table and one to many associations

    // Person 4 => Contact for Company 1
    const contact1 = await Contact.create({ position: 'CEO' });
    await contact1.setPerson(person4);
    await company1.setContacts(contact1);

    const contact2 = await Contact.create({ position: 'Head of HR' });
    await contact2.setPerson(person5);
    await company2.setContacts(contact2);

    const person6 = await Person.create({ firstName: 'Dom', lastName: 'Rumbo', phone: '074843732635', email: 'rumbo@gmail.com' });
    // Using m:n
    // await person6.addCompany(company2, { through: { position: 'HR' } });
    
    // Using a manual join table
    const contact3 = await Contact.create({ position: 'HR Manager' });
    await contact3.setPerson(person6);
    await company3.setContacts(contact3);

    const person7 = await Person.create({ firstName: 'Ruth', lastName: 'Symonds', phone: '0736463748', email: 'ruth@gmail.com' });
    // await person7.addCompany(company3, { through: { position: 'Head of Gin' } });

    const contact4 = await Contact.create({position: 'Head of Gin'});
    await contact4.setPerson(person7);
    await company4.addContact(contact4);

    const person8 = await Person.create({ firstName: 'Alex', lastName: 'May', phone: '0736463748', email: 'maylord@gmail.com' });
    const person9 = await Person.create({ firstName: 'John', lastName: 'Gantlett', phone: '0736463748', email: 'ganty@gmail.com' });

    const contact5 = await Contact.create({ position: 'Head of HR' });
    await contact5.setPerson(person8);
    await company4.addContact(contact5);

    const contact6 = await Contact.create({ position: 'HR' });
    await contact6.setPerson(person9);
    await company4.addContact(contact6);

    const person10 = await Person.create({ firstName: 'Greg', lastName: 'Davis', phone: '0736463748', email: 'gregoryd@gmail.com' });
    const contact7 = await Contact.create({ position: 'CEO' });
    await contact7.setPerson(person10);
    await company5.addContact(contact7);

    const person11 = await Person.create({ firstName: 'Rory', lastName: 'Davis', phone: '0736463748', email: 'rory@gmail.com' });
    const contact8 = await Contact.create({ position: 'CEO' });
    await contact8.setPerson(person11);
    await company6.addContact(contact8);

    const person12 = await Person.create({ firstName: 'Joe', lastName: 'Devine', phone: '0736463748', email: 'joe@gmail.com' });
    const contact9 = await Contact.create({ position: 'CEO' });
    await contact9.setPerson(person12);
    await company7.addContact(contact9);

    const person13 = await Person.create({ firstName: 'Susan', lastName: 'Jones', phone: '0736463748', email: 'susan@gmail.com' });
    const contact10 = await Contact.create({ position: 'CEO' });
    await contact10.setPerson(person13);
    await company8.addContact(contact10);

    const person14 = await Person.create({ firstName: 'Tosia', lastName: 'Pole', phone: '0736463748', email: 'tosia@gmail.com' });
    const contact11 = await Contact.create({ position: 'CEO' });
    await contact11.setPerson(person14);
    await company9.addContact(contact11);

    // await person8.addCompany(company4, { through: { position: 'Head of HR' } });
    // await person9.addCompany(company4, { through: { position: 'HR' } });
}