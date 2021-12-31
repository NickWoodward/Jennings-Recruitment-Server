const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Job = sequelize.define('job', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    wage: {
        type: Sequelize.DOUBLE,
        allowNull: false
    },
    location: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // #TODO: .TEXT is being set to varchar(255) rather than being unlimited
    description: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    jobType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    position: {
        type: Sequelize.STRING,
        allowNull: false
    },    
    pqe: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
    },
    updatedAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
    }
});

module.exports = Job;