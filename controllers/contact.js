const { sendEmail } = require('../util/sendGrid');

exports.submitContactForm = async (req, res, next) => {
    console.log('sending email');
    console.log(req.body);
    try {
        const response = await sendEmail(req.body.subject, req.body.message, req.body.email);
        console.log(response);
        if(response[0].statusCode != 200 && response[0].statusCode != 202) throw new Error('Email not sent');

        res.status(200).json({ msg: "Thanks, we'll get back to you shortly!" });
    } catch(err) {
        console.log(err);
        res.status(500).json({ msg: "Email not sent, please contact us using one of the other methods" });
    } 

  
}