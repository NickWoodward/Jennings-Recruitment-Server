const sequelize = require('../util/database');
const Sequelize = require('sequelize');

const Applicant = sequelize.define('applicant', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    cvUrl: {
        type: Sequelize.STRING,
        allowNull: true
    }
});

module.exports = Applicant;