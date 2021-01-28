const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token');

    if(!token) {
        return res.status(401).json({msg: 'no token, authorization denied'});
    }

    try {
        const decoded = jwt.verify(token, config.get('jwtToken'));
        req.users = decoded.user;
        next();
    }catch(err) {
       res.status(401).json({msg: 'token is not valid'});
    }
}