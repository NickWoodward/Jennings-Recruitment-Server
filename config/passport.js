const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const fs = require('fs');
const path = require('path');

const User = require('../models/user');

// Local key pair @TODO: change for server
const pathToKey = path.join(__dirname, '../../', 'jennings.pem');

const PUB_KEY = fs.readFileSync(pathToKey, 'utf-8');

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ['RS256']
}

function initialize(passport) {
    // JWT payload passed to verify callback
    // Internally passport uses the jsonwebtoken verify method to verify the jwt
    const authenticateUser = async(jwt_payload, done) => {
        // Check for user (subject property of token has been assigned the db ID of each user)
        let user;
        try {
            user = await User.findOne({
                where: { id: jwt_payload.sub }
            });
        } catch(e) {
            return done(e, false);
        }

        // No user found
        if(!user) {
            return done(null, false);
        }
        //  User found
        return done(null, user);
    };

    passport.use(new JwtStrategy(options, authenticateUser));
}

module.exports = initialize;