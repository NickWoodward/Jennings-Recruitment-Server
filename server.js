const app = require('./app');
const sequelize = require('./util/database');
const { createDatabaseAssociations, populateDB } = require('./util/dbUtils');
const utils = require('./util/utils');

// COMMUNICATION APIs
const twilio = require('./util/twilio');
const sendGrid = require('./util/sendGrid');
const conversations = require('./controllers/conversations');

// sequelize.sync({force: true})
// alter: true looks at changes in columns

const startServer = async( mode ) => {
    if(mode) {
        await createDatabaseAssociations();
        await sequelize.sync({force: true});
        await populateDB();
        // empty cv folder
        utils.cleanDirectory("cvs");
    } else {
        await createDatabaseAssociations();
        await sequelize.sync();
    }

    const server = app.listen(process.env.SERVER_PORT);
};

// startServer('test');
startServer();


    // .then(async result => {
    //     const server = app.listen(process.env.SERVER_PORT);
    //     const io = require('./util/socket').init(server);
    //     io.on('connection', socket => {
    //         console.log('connection');
    //         socket.on('chatbox', (data) => {
    //             twilio.sendSMS(data, socket.id);
    //             sendGrid.sendEmail(data);
    //             // reply(socket, data);
    //         });
    //         socket.on('disconnect', () => {
    //             console.log('disconnected');
    //             conversations.deleteConversation(socket.id);
    //         })
    //     });

    //     // Set up sequelize table relationships
    //     await createDatabaseAssociations();
    //     // populateDB();
    // })
    // .catch(err => {
    //     console.log(err);
    // });

const reply = (socket, data) => {
    socket.emit('response', { 
        user: socket.id, 
        message: `This is the server. You sent me: "${data}"` 
    });
}
