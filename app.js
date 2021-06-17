require('dotenv').config();
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./util/database');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');


// MODELS
const Job = require('./models/job');
const Person = require('./models/person');
const Company = require('./models/company');
const Contact = require('./models/contacts');
const Applicant = require('./models/applicant');
const Application = require('./models/application');
const Address = require('./models/address');

// ROUTES
const jobRoutes = require('./routes/jobs');
const authRoutes = require('./routes/authentication');
const usersRoutes = require('./routes/users');
const applicationRoutes = require('./routes/applications');
const companyRoutes = require('./routes/companies');
const messagingRoutes = require('./routes/messaging');
const adminRoutes = require('./routes/admin');

// COMMUNICATION APIs
const twilio = require('./util/twilio');
const sendGrid = require('./util/sendGrid');
const conversations = require('./controllers/conversations');

const app = express();

const store = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// @TODO: Note that Nginx proxying might require the use of 'app.set('trust proxy', 1)' in express.
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false, store: store, cookie: {secure: process.env.NODE_ENV === 'production'? true: false} }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8082');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    next();
});

// @TODO: remove passport
// app.use(passport.initialize());

app.use('/jobs', jobRoutes);
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/applications', applicationRoutes);
app.use('/companies', companyRoutes);
app.use('/sms', messagingRoutes);
app.use('/admin', adminRoutes);


app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    console.log(error.message);
    const message = (status === 500 && process.env.NODE_ENV !== 'development' )? 'Please contact us directly':error.message;
    const validationErrors = error.validationErrors? error.validationErrors.map(({param, msg}) => { return {param, msg}}):[];

    res.status(status).json({ message: `Caught in app.js ${message}`, error: validationErrors });
});

// SET UP ASSOCIATIONS
    // Companies 1:M Jobs, Job has mandatory fk
    Company.hasMany(Job, { foreignKey: { name: 'companyId', allowNull: false } });
    Job.belongsTo(Company, { foreignKey: { name: 'companyId', allowNull: false } });

    // Address M:N Companies
    Company.belongsToMany(Address, { through: 'CompanyAddress' });
    Address.belongsToMany(Company, { through: 'CompanyAddress' });

    // Applicant is a subtype of Person
    Person.hasOne(Applicant, { foreignKey: { name: 'personId', allowNull: false, unique: true } });
    Applicant.belongsTo(Person, { foreignKey: { name: 'personId', allowNull: false, unique: true } });

    // Applicants M:N Jobs (through Application)
    Applicant.belongsToMany(Job, { through: Application });
    Job.belongsToMany(Applicant, { through: Application });

    // Person M:N Company (through Contact)
    Person.belongsToMany(Company, { through: Contact });
    Company.belongsToMany(Person, { through: Contact });

// sequelize.sync({force: true})
sequelize.sync()
    .then(async result => {
        const server = app.listen(8080);
        const io = require('./util/socket').init(server);
        io.on('connection', socket => {
            console.log('connection');
            socket.on('chatbox', (data) => {
                twilio.sendSMS(data, socket.id);
                sendGrid.sendEmail(data);
                // reply(socket, data);
            });
            socket.on('disconnect', () => {
                console.log('disconnected');
                conversations.deleteConversation(socket.id);
            })
        });
        
        // Testing:

        // // JOB:COMPANY association
        // const JRS = await Company.create({ name: 'JRS',  address: 'Somewhere in Devon'});
        // const woodwork = await Company.create({ name: 'WoodWork', address: 'Devizes' });
        // const jobOne = await Job.create({ title: 'Job 1', wage: 80000, location: 'Bristol', description: 'A test job', featured: true, companyId: JRS.id });
        // const jobTwo = await Job.create({ title: 'Job 2', wage: 100000, location: 'Reading', description: 'A test job', featured: true, companyId: woodwork.id});

        // const address1 = await Address.create({ firstLine: 'Kemp House', secondLine: '152 City Road', city: 'London', county: 'Greater London', postcode: 'EC1V 2NX' });
        // const address2 = await Address.create({ firstLine: 'Forge House', secondLine: 'Rushall', city: 'Pewsey', county: 'Wiltshire', postcode: 'SN9 6EN' });
        // JRS.addAddress(address1);
        // JRS.addAddress(address2);

        // // Deletes the job associated with company too
        // // await JRS.destroy();

        // // PERSON:APPLICANT association
        // const personOne = await Person.create({ firstName: 'Nick', lastName: 'Woodward', phone: '074843732635', email: 'nickwoodward@gmail.com' });
        // const applicantOne = await Applicant.create({ personId: personOne.id, cvUrl: 'thisismycv.doc' });
        // const personTwo = await Person.create({ firstName: 'Will', lastName: 'Woodward', phone: '074843732635', email: 'willwoodward@gmail.com' });
        // const applicantTwo = await Applicant.create({ personId: personTwo.id });

        // // Will delete both the person and the associated applicant
        // // await personTwo.destroy();

        // // APPLICANT:JOB association (through applications)
        // await jobTwo.addApplicant(applicantOne);
        // await jobOne.addApplicant(applicantTwo);
        // await jobTwo.addApplicant(applicantTwo);
        // // await jobTwo.addApplicant(applicantTwo);

        // const applicationThree = await Application.findOne({ where: { applicantId: applicantTwo.id, jobId: jobTwo.id } });
        // // applicationThree.destroy();

        // // PERSON:COMPANY association (through contacts)
        // personOne.addCompany(JRS, { through: { position: 'Head of sales' } });

    })
    .catch(err => {
        console.log(err);
    });

    const reply = (socket, data) => {
        socket.emit('response', { 
            user: socket.id, 
            message: `This is the server. You sent me: "${data}"` 
        });
    }

