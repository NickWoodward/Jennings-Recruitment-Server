const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const conversations = require('../controllers/conversations');

const io = require('./socket');

const { nanoid } = require('nanoid');
// Low traffic to the live chat, low chance of collision, so low length can be used.
// For tolerances see: https://zelark.github.io/nano-id-cc/
const ID_LENGTH = 4;

// Twilio rest client
const client = require('twilio')(accountSid, authToken);

exports.sendSMS = (msg, socketId) => {
    const shortenedSID = nanoid(ID_LENGTH);

    client.messages.create({
        to: process.env.MY_PHONE_NUMBER,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `${msg} [ID ${shortenedSID}]`
    })
    .then(message => {
            console.log(message.sid)
            // If this socket hasn't started an active conversation, create an entry in the map with a short key.
            // The socketId isn't used due to length
            conversations.addConversation(socketId, shortenedSID);
        });
}

exports.handleReply = (req, res, next) => {    
    const msg = req.body.Body;
    // Format of the msg = message body + [ID xxxx]
    const index = msg.indexOf('[ID ');
    const startOfId = index + 4;
    const endOfId = startOfId + ID_LENGTH;
    const id = endOfId <= msg.length? msg.substring(startOfId, endOfId) : -1;

    if(index === -1 || id === -1 || msg.charAt(endOfId) !== ']') {
        // If there's no valid ID, ask for the message to be resent 
        const twiml = new MessagingResponse();
        twiml.message('Please respond with the previous message id at the end of the message: [ID xxxx]');        
        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(twiml.toString());

    // If there's a valid ID, check the active conversation Map
    } else if(conversations.getActiveConversations().has(id)) {
        conversations.sendToFrontEnd(id, req.body.Body);
        res.status(200);
    } else if(!conversations.getActiveConversations().has(id)) {
        const twiml = new MessagingResponse();
        twiml.message('It looks like the user has left the chat');        
        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(twiml.toString());
    }

};

