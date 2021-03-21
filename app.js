require('dotenv').config();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const sequelize = require('./util/database');


const Job = require('./models/job');

const jobRoutes = require('./routes/jobs');
const authRoutes = require('./routes/authentication');
const usersRoutes = require('./routes/users');

const users = require('./controllers/users');

const app = express();
const fileStorage =  multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'cvs');    
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}.${file.originalname}`);
    }
});

app.use(bodyParser.json());
app.use('/cv', express.static(path.join(__dirname, 'cvs')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// @TODO: remove passport
// app.use(passport.initialize());

app.use('/jobs', jobRoutes);
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const validationErrors = error.validationErrors? error.validationErrors.map(({param, msg}) => { return {param, msg}}):[];

    res.status(status).json({ message: `Caught in app.js ${message}`, validationErrors });
});

// sequelize.sync({force: true})
sequelize.sync()
    .then(result => {
        app.listen(8080);
    })
    .catch(err => {
        console.log(err);
    });

