const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SEND_GRID_KEY);

// https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication

exports.sendEmail = (subject, message, author) => {
    const msg = {
        to: process.env.TARGET_EMAIL,
        from: process.env.MY_EMAIL,
        replyTo: author,
        subject: subject,
        html: `<strong>${message}</strong>`
    };

    return sgMail.send(msg);
}