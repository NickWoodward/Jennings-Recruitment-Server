const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Contact = sequelize.define('contact', {
    position: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Contact;