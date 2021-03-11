const bcrypt = require('bcrypt');
const passport = require('passport');

const User = require('../models/user');
const utils = require('../util/utils');



exports.login = (req, res, next) => {
    (async() => {
        try {
            const user = await User.findOne({ where: {email: req.body.email} });
            if(!user) {
                res.status(401).json({ success: false, message: "Bad Username/Password" });
            }

            const isValid = await bcrypt.compare(req.body.password, user.hashedPassword);

            if(isValid) {
                const tokenObject = utils.issueJWT(user);
                res.status(200).json({ success: true, token: tokenObject.token, expiresIn: tokenObject.expires});
            } else {
                res.status(401).json({ success: false, message: "Bad Username/Password" });
            }

        } catch(err) {
            next(err);
        }
    })();
};

// @TODO: Add express validator?
exports.register = async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        // Create new user
        const user = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,
            email: req.body.email,
            hashedPassword: hashedPassword
        });

        //  Send success response
        res.status(201).json({ success: true, message: `Welcome ${req.body.firstName}` });

    } catch(e) {
        console.log(e);
        res.status(500).json({ error: "Something went wrong" });
    }
};