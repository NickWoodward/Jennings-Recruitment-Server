const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Application = sequelize.define('application', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        notNull: true
    }
});

module.exports = Application;