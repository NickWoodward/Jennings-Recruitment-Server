const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SEND_GRID_KEY);

exports.sendEmail = (content) => {
    const msg = {
        to: process.env.MY_EMAIL,
        from: process.env.MY_EMAIL,
        subject: 'test',
        test: content,
        html: '<strong>THIS IS THE HTML TAG</strong>'
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('email sent');
        })
        .catch(err => console.log(err))

}