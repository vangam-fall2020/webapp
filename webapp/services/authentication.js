const db = require("../models");
const User = db.users;
const bcrypt = require('bcrypt');

const SDC = require('statsd-client'),
    sdc = new SDC({ host: 'localhost', port: 8125 });
const log4js = require('log4js');
log4js.configure({
    appenders: { logs: { type: 'file', filename: '/home/ubuntu/webapp/logs/webapp.log' } },
    categories: { default: { appenders: ['logs'], level: 'info' } }
});
const logger = log4js.getLogger('logs');

// User Authentication (Basic)
function basicAuth(req, res, next) {
    sdc.increment('Authentication check Triggered');
    let contentType = req.headers['content-type'];
    var authHeader = "";
    authHeader = req.headers.authorization;

    if (!authHeader) {
        logger.error('Unauthorized');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // verify auth credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    let dbtimer = new Date();
    User.findOne({ where: { username: username } }).then(data => {
        if (data) {
            bcrypt.compare(password, data.dataValues.password, (err, result) => {

                if (result) {
                    const { password, ...userWithoutPassword } = data.dataValues;
                    res.locals.user = userWithoutPassword;

                    next(); // authorized
                    logger.info("User Authoried");
                    return res.locals.user;
                } else {
                    logger.error('Unauthorized');
                    return res.status(401).json({ message: 'Unauthorized' });
                }
            });

        } else {
            logger.error('Unauthorized');
            return res.status(401).json({ message: 'Unauthorized' });
        }
    })
    sdc.timing('get.userdb.timer', dbtimer);
}

module.exports.basicAuth = basicAuth;
