const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Company = sequelize.define('company', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    address: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Company;