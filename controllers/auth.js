const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const utils = require('../util/utils');

// @TODO: check cookie is secure/httpOnly
exports.loginAdmin = (req, res, next) => {
    console.log('logging in');
    req.session.isLoggedIn = true;
    User.findOne({ where: { email: 'nickwoodward@hotmaill.com' } }).then(result => {
        req.session.user = result
        res.status(200).json({msg: 'logged in', isLoggedIn: req.session.isLoggedIn});

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

