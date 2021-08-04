const Sequelize = require('sequelize');

const dbName = process.env.NODE_ENV !== 'testing'?  process.env.DB_DATABASE : process.env.DB_TEST_DATABASE;
const logging = process.env.NODE_ENV === 'testing'? false:true;

const sequelize = new Sequelize(dbName, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: 'mysql', 
    host: process.env.DB_HOST,
    logging: msg => { if(logging) console.log(msg) }
});

module.exports = sequelize;