const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../models/person');
const utils = require('../util/utils');

// @TODO: check cookie is secure/httpOnly
exports.loginAdmin = (req, res, next) => {
    User.findOne({ where: { email: 'nickwoodward@hotmail.com' } }).then(result => {

        if(result) {

            req.session.user = `${result.firstName} ${result.lastName}`;
            req.session.save(err => {
                console.log(err);
                res.status(200).json({msg: 'logged in'});
            });
        }
    })
    .catch(err => console.log(err));
};

exports.logoutAdmin = (req, res, next) => {
    console.log('logging out ' + JSON.stringify(req.session));

    req.session.destroy(err => {

        console.log(err);
        console.log(req.session);
        res.status(200).json({ msg: 'Logged Out', isLoggedIn: req.session });
    });
};


// @TODO: Delete on production, save for portfolio site with user logins

// exports.login = (req, res, next) => {
//     const errors = validationResult(req);
//     if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     (async() => {
//         try {
//             const user = await User.findOne({ where: {email: req.body.email} });
//             if(!user) {
//                 return res.status(401).json({ success: false, message: "Bad Username/Password" });
//             }
//             const isValid = await bcrypt.compare(req.body.password, user.hashedPassword);

//             if(isValid) {
//                 const tokenObject = utils.issueAccessToken(user);
//                 return res.status(200).json({ success: true, token: tokenObject.token, expiresIn: tokenObject.expires});
//             } else {
//                 return res.status(401).json({ success: false, message: "Bad Username/Password" });
//             }

//         } catch(err) {
//             next(err);
//         }
//     })();
// };

