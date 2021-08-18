const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Address = sequelize.define('address', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    firstLine: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    secondLine: {
        type: Sequelize.STRING
    },
    city: {
        type: Sequelize.STRING,
        allowNull: false
    }, 
    county: {
        type: Sequelize.STRING,
        allowNull: false
    },
    postcode: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Address;