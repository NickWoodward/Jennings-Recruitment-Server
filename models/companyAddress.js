const sequelize = require('../util/database');
const Sequelize = require('Sequelize');

const CompanyAddress = sequelize.define('companyaddress',  {}, {
    freezeTableName: true
  });

module.exports = CompanyAddress; 