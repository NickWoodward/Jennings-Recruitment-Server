require('dotenv').config();
const path = require('path');
// @TODO replace with nanoid
const { v4: uuidv4 } = require('uuid');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const sequelize = require('./util/database');

const Job = require('./models/job');

const jobRoutes = require('./routes/jobs');
const authRoutes = require('./routes/authentication');
const usersRoutes = require('./routes/users');
const messagingRoutes = require('./routes/messaging');

const users = require('./controllers/users');
const twilio = require('./util/twilio');
const sendGrid = require('./util/sendGrid');
const conversations = require('./controllers/conversations');

const app = express();
const fileStorage =  multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'cvs');    
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}.${file.originalname}`);
    }
});
// const fileFilter = (req, file, cb) => {
//     if(file.mimetype === )
// };

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/cv', express.static(path.join(__dirname, 'cvs')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// @TODO: remove passport
// app.use(passport.initialize());

app.use('/jobs', jobRoutes);
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/sms', messagingRoutes);

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const validationErrors = error.validationErrors? error.validationErrors.map(({param, msg}) => { return {param, msg}}):[];

    res.status(status).json({ message: `Caught in app.js ${message}`, error: validationErrors });
});

// sequelize.sync({force: true})
sequelize.sync()
    .then(result => {
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

