const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../models/user');

exports.deleteUser = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('No such user');
        error.statusCode = 422;
        throw error;
    }

    User.findByPk(req.params.id).then(user => {
        if(user) {
            user.destroy();
            res.status(200).json({ message: "User found", user });
        } else {
            res.status(400).json({ message: 'User not found' });
        }
    }).catch(e => {
        if(!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    });
};

exports.getUsers = (req, res, next) => {
    User.findAll({ attributes: [ 'id', 'firstName', 'phone', 'email', 'createdAt' ] })
        .then(users => {
            if(users) {
                return res.status(200).json({ users });
            }
        })
        .catch(e => console.log(e));
};

exports.getUser = (req, res, next) => {
    const userId = req.params.id;
    User.findByPk(userId).then(user => {
            if(user) {
                const { firstName, lastName, phone, email } = user;
                return res.status(200).json({ firstName, lastName, phone, email });
            } else {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }
        })
        .catch(e => {
            if(!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        });
};

exports.registerUser = async(req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, incorrect data');
        error.validationErrors = errors.array();
        error.statusCode = 422;
        return next(error);
    }

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
        if(!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};
