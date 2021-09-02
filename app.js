require('dotenv').config();
const path = require('path');

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const app = express();

const store = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


// @TODO: Note that Nginx proxying might require the use of 'app.set('trust proxy', 1)' in express.
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false, store: store, cookie: {secure: process.env.NODE_ENV === 'production'? true: false} }));

// @TODO: remove passport
// app.use(passport.initialize());

require('./startup/headers')(app);
require('./startup/routes')(app);

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    // console.log(error.validationErrors);
    // @TODO: fix
    const message = (status === 500 && process.env.NODE_ENV !== 'development' )? 'Please contact us directly':error.message;
    const validationErrors = error.validationErrors? error.validationErrors.map(({param, msg}) => { return {param, msg}}):[];

    res.status(status).json({ message: `Caught in app.js ${message}`, error: validationErrors });
});

module.exports = app;
