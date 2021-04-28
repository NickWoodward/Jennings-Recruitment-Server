const express = require('express');
const router = express.Router();
const twilioController = require('../util/twilio');

// @TODO: protect this route - twilio guide: https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js
router.post('/', twilioController.handleReply);

module.exports = router;