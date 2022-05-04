const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Local key pair @TODO: change for server
const pathToKey = path.join(__dirname, '../../', 'jennings');
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf-8');

/**
 * 
 * @param {*} user - The user object. Needed to set the JWT subject property to the user id 
 */

exports.issueAccessToken = (user) => {
    const id = user.id;
    const expiresIn = '1h';

    const payload = {
        sub: id,
        iat: Date.now()
    };

    // const signedToken = jwt.sign(payload, 'secret', { expiresIn,  algorithm: 'RS256'});
    const signedToken = jwt.sign(payload, PRIV_KEY, { expiresIn, algorithm:'RS256' });
    return {
        token: "" + signedToken,
        expires: expiresIn
    }
};

exports.createString = (num) => {
    let temp = '';
    for(let x = 0; x < num; x++) {
        temp += 'a';
    }
    return temp;
} 

exports.deleteCv = async (filePath) => {
    try {
        await fs.promises.unlink(`cvs/${filePath}`);
    } catch (err) {
        console.log(err);
    }
}; 


exports.cleanDirectory = async (directory) => {
    try {
        await fs.promises.readdir(directory).then((files) => Promise.all(files.map(file => fs.promises.unlink(`${directory}/${file}`))));
    } catch(err) {
        console.log(err);
    }
}

