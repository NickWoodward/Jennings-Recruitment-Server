const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const hubspot = require('../util/hubspot');
const Sequelize = require('sequelize');

const User = require('../models/person');

exports.addToHubspot = (req, res, next) => {
    // const user = {
    //     fname: req.body.firstName,
    //     surname: req.body.lastName,
    //     phone: req.body.phone,
    //     email: req.body.email,

    // }
    const id = req.params.id;
    User.findByPk(id)
        .then(user => {
            if(user) {
                const { firstName, lastName, email, phone } = user;

                // console.log(JSON.stringify(user));
                return hubspot.createUser(firstName, lastName, email, phone );         
            }
        })
        .then(response => {
            const data = response.response;
            console.log(JSON.stringify(data.body));
            console.log(response.IncomingMessage);

            if(data.statusCode === 201) {
                res.status(201).json({ msg: 'User created', data });
            } else if(data.statusCode === 409) {

            } else {
                res.status(404).json({ msg: 'User not found' });
            }
        })
        .catch(err => console.log(JSON.stringify(err)));

    
        
};

exports.editUser = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation error');
        error.validationErrors = errors.array();
        error.statusCode = 422;
        throw error;
    }      
    User.findByPk(req.params.id)
        .then(user => {
            if(user) {
                user.firstName = req.body.firstName;
                user.lastName = req.body.lastName;
                user.phone = req.body.phone;
                user.email = req.body.email;
                user.cvUrl = req.body.cvUrl;
                
                return user.save();
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        }).then(user => {
            if(user){
                res.status(200).json({ message: 'User edited' });
            }
        })
        .catch(error => {
            if(!error.statusCode) {
                error.statusCode = 500;
                next(error);
            }
        });
};

exports.deleteUser = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation error');
        error.validationErrors = errors.errors.array();
        error.statusCode = 422;
        throw error;
    }

    User.findByPk(req.params.id).then(user => {
        if(user) {
            user.destroy().then(user => {
                res.status(200).json({ message: "User deleted"});
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    }).catch(e => {
        if(!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    });
};

exports.deleteUserByEmail = (req, res, next) => {
    User.findOne({ where: { email: req.params.email } }).then(user => {
        if(user) {
            user.destroy().then(user => {
                res.status(200).json({message: 'User deleted'});
            });
        } else {
            res.status(404).json({message: 'User not found'});
        }
    }).catch(err => console.log(err));
}

exports.getUsers = (req, res, next) => {

    User.findAll({ 
        attributes: [ 
            'id', 
            'firstName', 
            'lastName', 
            'phone', 
            'email', 
            [Sequelize.fn('date_format', Sequelize.col('createdAt' ), '%d/%m/%y'), 'createdAt']
        ] })
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

exports.getUserHeaders = (req, res, next) => {
    const result = [];
    for(let key in User.rawAttributes) {
        result.push(key);
    }
    res.status(200).json({msg: 'success', headers: result});
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
        // @TODO: check mysql unique logic, if not working, search for existing user/email 

        // Create new user
        const user = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,
            email: req.body.email,
            hashedPassword: hashedPassword
        });
        console.log(user);
        //  Send success response
        res.status(201).json({ 
            success: true, 
            message: `Welcome ${req.body.firstName} ${user.id}`, 
            user: { id: user.id, fname: user.firstName, lname: user.lastName, email: user.email, phone: user.phone, createdAt: user.createdAt } 
        });

    } catch(e) {
        if(!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};
