// @TODO: remove for production

export const authenticate = (req, res, next) => {
    // Bearer TOKEN
    const authHeader = req.headers['authorization'];
    if(!authHeader) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
};