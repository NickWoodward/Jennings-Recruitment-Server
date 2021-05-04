const io = require('../util/socket');
const ID_LENGTH = 4;

// Store a key value pair 
const activeConversations = new Map();
// testing 
activeConversations.set('a', 5);

exports.addConversation = (socketId, shortenedSID) => {

    const exists = [...activeConversations.values()].indexOf(socketId);
    if(exists === -1) activeConversations.set(shortenedSID, socketId);
}

exports.deleteConversation = (socketId) => {
    for(let [key, value] of activeConversations.entries()) {
        // If the socketId has started an active conversation in the past, delete them
        if(socketId === value) activeConversations.delete(key);
    }
}

exports.getActiveConversations = () => {
    return activeConversations;
}

exports.sendToFrontEnd = (id, msg) => {
        // Connect to the socket stored in the Map
        io.getIO().to(activeConversations.get(id)).emit('response', { message: removeID(msg)});
}

const removeID = (msg) => {
    // Format of the msg = message body + [ID xxxx]
    // Remove [ID xxxx], 
    const index = msg.indexOf('[ID ');
    const end = index + ID_LENGTH + 5; // 5 covers the [], ' ' and letters 'ID'

    if(end <= msg.length) return msg.slice(0, index) + msg.slice(end);
    return msg;
}