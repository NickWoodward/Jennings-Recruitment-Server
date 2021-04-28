const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const io = require('./socket');

const { nanoid } = require('nanoid');

const ID_LENGTH = 4;

// Twilio rest client
const client = require('twilio')(accountSid, authToken);

// Store a key value pair 
const activeConversations = new Map();
// testing 
activeConversations.set('a', 5);

exports.sendSMS = (msg, socketId) => {
    // Very little traffic so minor risk of collisions
    const shortenedSID = nanoid(ID_LENGTH);

    // TEST
    // const exists = [...activeConversations.values()].indexOf(socketId);
    // if(exists === -1) activeConversations.set(shortenedSID, socketId);
    // console.log(activeConversations);
    client.messages.create({
        to: process.env.MY_PHONE_NUMBER,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `${msg} [ID ${shortenedSID}]`
    })
    .then(message => {
            console.log(message.sid)
            // If this socket hasn't started an active conversation, create an entry in the map with a short key
            // The socketId isn't used as the key has to be manually typed in any reply, and it's too complex
            const exists = [...activeConversations.values()].indexOf(socketId);
            if(exists === -1) activeConversations.set(shortenedSID, socketId);
        });
}

exports.handleReply = (req, res, next) => {    
    console.log('handleReply');
    // extract the SocketId from the message:
    const msg = req.body.Body;
    // Format of the msg = message body + [ID xxxx]
    const index = msg.indexOf('[ID ');
    const startOfId = index + 4;
    const endOfId = startOfId + ID_LENGTH;
    const id = endOfId <= msg.length? msg.substring(startOfId, endOfId) : -1;
  

    // If there's a valid ID, check the active conversation Map
    if(index === -1 || id === -1 || msg.charAt(endOfId) !== ']') {
        // If there's no valid ID, ask for the message to be resent 
        const twiml = new MessagingResponse();
        twiml.message('Please respond with the previous message id at the end of the message: [ID xxxx]');        
        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(twiml.toString());

    } else if(activeConversations.has(id)) {
        // Connect to the socket stored in the Map
        io.getIO().to(activeConversations.get(id)).emit('response', { message: removeID(req.body.Body)});
        res.status(200);
    } else if(!activeConversations.has(id)) {
        const twiml = new MessagingResponse();
        twiml.message('It looks like the user has left the chat');        
        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(twiml.toString());
    }

};

const addConversation = (socketId) => {

}

exports.deleteConversation = (socketId) => {
    for(let [key, value] of activeConversations.entries()) {
        // If the socketId has started an active conversation in the past, delete them
        if(socketId === value) activeConversations.delete(key);
    }
}

const removeID = (msg) => {
    // Format of the msg = message body + [ID xxxx]
    // Remove [ID xxxx], 
    const index = msg.indexOf('[ID ');
    const end = index + ID_LENGTH + 5; // 5 covers the [], ' ' and letters 'ID'

    if(end <= msg.length) return msg.slice(0, index) + msg.slice(end);
    return msg;
}