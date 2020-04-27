require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');

const sequelize = require('./util/database');

const Job = require('./models/job');

const jobRoutes = require('./routes/jobs');

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/jobs', jobRoutes);

// sequelize.sync({force: true})
sequelize.sync()
    .then(result => {
        app.listen(8080);
    })
    .catch(err => {
        console.log(err);
    });

