const Sequelize = require('sequelize');

const dbName = process.env.NODE_ENV !== 'production'? process.env.DB_TEST_DATABASE : process.env.DB_DATABASE;

const sequelize = new Sequelize(dbName, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: 'mysql', 
    host: process.env.DB_HOST
});

module.exports = sequelize;