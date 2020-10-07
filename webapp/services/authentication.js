const db = require("../models");
const User = db.users;
const bcrypt = require('bcrypt');


// User Authentication (Basic)
function basicAuth(req, res, next) {
    let contentType = req.headers['content-type'];
    var authHeader = "";
    if (req.method == 'GET' || req.method == 'DELETE') {
        authHeader = req.headers.authorization;
    } else {
        if (contentType == 'application/json') {
            authHeader = req.headers.authorization;
        } else {
            return res.status(400).json({ message: 'Bad Request' });
        }
    }
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // verify auth credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    User.findOne({ where: { username: username } }).then(data => {
        if (data) {
            bcrypt.compare(password, data.dataValues.password, (err, result) => {

                if (result) {
                    const { password, ...userWithoutPassword } = data.dataValues;
                    res.locals.user = userWithoutPassword;

                    next(); // authorized
                    return res.locals.user;
                } else {
                    return res.status(401).json({ message: 'Unauthorized' });
                }
            });

        } else {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    })
}

module.exports.basicAuth = basicAuth;
