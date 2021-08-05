const app = require('./app');
const sequelize = require('./util/database');
const { populateDB } = require('./startup/associations');

// COMMUNICATION APIs
const twilio = require('./util/twilio');
const sendGrid = require('./util/sendGrid');
const conversations = require('./controllers/conversations');

// sequelize.sync({force: true})
// alter: true looks at changes in columns
sequelize.sync()
    .then(async result => {
        const server = app.listen(8080);
        const io = require('./util/socket').init(server);
        io.on('connection', socket => {
            console.log('connection');
            socket.on('chatbox', (data) => {
                twilio.sendSMS(data, socket.id);
                sendGrid.sendEmail(data);
                // reply(socket, data);
            });
            socket.on('disconnect', () => {
                console.log('disconnected');
                conversations.deleteConversation(socket.id);
            })
        });

        // populateDB();
    })
    .catch(err => {
        console.log(err);
    });

const reply = (socket, data) => {
    socket.emit('response', { 
        user: socket.id, 
        message: `This is the server. You sent me: "${data}"` 
    });
}