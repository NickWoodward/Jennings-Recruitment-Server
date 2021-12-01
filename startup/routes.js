const express = require('express');

const jobRoutes = require('../routes/jobs');
const authRoutes = require('../routes/authentication');
const usersRoutes = require('../routes/users');
const applicationRoutes = require('../routes/applications');
const companyRoutes = require('../routes/companies');
const messagingRoutes = require('../routes/messaging');
const adminRoutes = require('../routes/admin');
const contactRoutes = require('../routes/contact');

module.exports = (app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.use('/jobs', jobRoutes);
    app.use('/auth', authRoutes);
    app.use('/users', usersRoutes);
    app.use('/applications', applicationRoutes);
    app.use('/companies', companyRoutes);
    app.use('/sms', messagingRoutes);
    app.use('/admin', adminRoutes);
    app.use('/contact', contactRoutes);
} 