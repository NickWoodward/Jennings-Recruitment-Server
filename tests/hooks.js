process.env.NODE_ENV = 'testing';
require('dotenv').config();

const sinon = require('sinon');

const sequelize = require('../util/database');

const { createDatabaseAssociations, populateDB } = require('../util/dbUtils');

// Options object is referenced in the test script
exports.mochaHooks = {
    beforeAll: async function() {
        console.log('-------------------------------- BEFORE ALL TESTS ----------------------------------------');
        await createDatabaseAssociations();
    },

    beforeEach: async function() {
        console.log('-------------------------------- BEFORE EACH TEST ----------------------------------------');

        await sequelize.sync({ force: true });
        await populateDB();
    },

    afterAll: async function() {
        console.log('-------------------------------- AFTER ALL TESTS ----------------------------------------');

        // await connection.close();
    },

    afterEach: async function() {
        console.log('-------------------------------- AFTER EACH TEST ----------------------------------------');
        sinon.restore();
    }
}

// before(async function() {
//     console.log('-------------------------------- BEFORE ALL TESTS ----------------------------------------');
//     await createDatabaseAssociations();
// })

// beforeEach(async function() {
//     console.log('-------------------------------- BEFORE EACH TEST ----------------------------------------');

//     await sequelize.sync({ force: true });
//     await populateDB();  
// }),

// after(async function() {
//     console.log('-------------------------------- AFTER ALL TESTS ----------------------------------------');

//     // await connection.close();
// }),

// afterEach(async () => {
//     console.log('-------------------------------- AFTER EACH TEST ----------------------------------------');
//     sinon.restore();
// })
