const db = require("../models");
const User = db.users;
const emailValidator = require('email-validator');
const validator = require('../services/password_validation');
const bcrypt = require('bcrypt');
const moment = require('moment');
const saltRounds = 10;
let userAuth = require('../services/authentication');
const router = require("express").Router();

const SDC = require('statsd-client'),
sdc = new SDC({host: 'localhost' , port:8125});
const log4js = require('log4js');
	log4js.configure({
	  appenders: { logs: { type: 'file', filename: '/home/manasa/webapp/logs/webapp.log' } },
	  categories: { default: { appenders: ['logs'], level: 'info' } }
    });
const logger = log4js.getLogger('logs');


// Api calls to protected routes
module.exports = app => {

    // Create a new User
    router.post("/", (req, res, next) => {
        sdc.increment('POST User Triggered');
        let timer = new Date();
        let contentType = req.headers['content-type'];
        if (contentType == 'application/json') {
            var firstName = req.body.first_name;
            var lastName = req.body.last_name;
            var password = req.body.password;
            var emailAddress = req.body.username;

            if (firstName != null && lastName != null && password != null && emailAddress != null
                && validator.validate(password) == true && emailValidator.validate(emailAddress) == true) {
                let salt = bcrypt.genSaltSync(saltRounds);
                let hashedPassword = bcrypt.hashSync(password, salt);
                const account_created = moment().format();
                const account_updated = moment().format();

                let dbtimer = new Date();
                // Save User in the database
                User.create({
                    first_name: firstName,
                    last_name: lastName,
                    password: hashedPassword,
                    username: emailAddress,
                    account_created: account_created,
                    account_updated: account_updated
                })
                    .then(data => {
                        logger.info('User created successfully');
                        res.status(201).send({
                            id: data.id,
                            first_name: firstName,
                            last_name: lastName,
                            username: emailAddress,
                            account_created: account_created,
                            account_updated: account_updated
                        });
                    })
                    .catch(err => {
                        logger.error(err);
                        res.status(400).send({
                            message: "Bad Request"
                        });
                    });
                sdc.timing('post.userdb.timer', dbtimer);

            }
            else if (firstName == null || lastName == null || password == null || emailAddress == null
                || firstName == "" || lastName == "" || password == "" || emailAddress == "") {
                    logger.error('some of the input fields are missing');
                res.status(400).json({ msg: 'Please enter all details!' });
            }
            else if (emailValidator.validate(emailAddress) == false) {
                logger.error('Not valid Email ID');
                res.status(400).json({ msg: `${emailAddress} is not a valid email address!` });
            }
            else {
                logger.error('Password must follow NIST standards');
                res.status(400).json({
                    msg: 'Password must contain a lowercase, an uppercase,a digit and must be atleast 8 letters & a symbol! NO Spaces Allowed'
                });
            }
        }
        else {
            logger.error('Request type must be JSON');
            res.status(400).json({ msg: 'Request type must be JSON!' });
        }
        sdc.timing('post.user.timer', timer);
    });

    // Retrieve all users
    router.get("/self", userAuth.basicAuth, (req, res) => {
        sdc.increment('GET User Triggered');
        let timer = new Date();
        if (res.locals.user) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(res.locals.user);

        }else {
            logger.error('Unauthorized User');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('get.user.timer', timer);
    });

    // GET a User with given id.
    router.get("/:id", (req, res, next) => {
        sdc.increment('GET User Triggered');
        let timer = new Date();

       let dbtimer = new Date();
   
        // Save User in the database
        User.findByPk(req.params.id)
            .then(data => {
                res.status(200).send({
                    id: data.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    username: data.username,
                    account_created: data.account_created,
                    account_updated: data.account_updated
                });
            })
            .catch(err => {
                logger.error('User Not found');
                res.status(404).send({
                    message: "Not Found"
                });
            });
            sdc.timing('get.userdb.timer', dbtimer);
            sdc.timing('get.user.timer', timer);

    });

    // Update a user
    router.put("/self", userAuth.basicAuth, (req, res) => {
        sdc.increment('PUT User Triggered');
        let timer = new Date();
        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {
                    let password = req.body.password;
                    let username = req.body.username;
                    let first_name = req.body.first_name;
                    let last_name = req.body.last_name;
                    if (password != null && validator.validate(password)) {
                        var hashedPassword = bcrypt.hashSync(password, 10);
                        req.body.password = hashedPassword;
                    } else if (password != null) {
                        logger.error('Password must follow NIST standard');
                        return res.status(400).json({ msg: 'Bad Request' });
                    }
                    if (first_name == null || last_name == null || username == null || password == null ||
                        first_name == "" || last_name == "" || username == "" || password == "") {
                            logger.error('Input values should not be null');
                        return res.status(400).json({ msg: 'Bad Request' });
                    } else {
                        let dbtimer = new Date();
                        User.findOne({ where: { username: res.locals.user.username } }).then(data => {
                            if (data) {
                                if (data.username == username) {
                                    User.update({
                                        first_name: first_name,
                                        last_name: last_name,
                                        password: hashedPassword,
                                        account_updated: moment().format()
                                    }, {
                                        where: { username: username }
                                    }).then(data => {
                                        res.status(204).send();
                                    }).catch(err => {
                                        res.status(400).send({
                                            message: "Bad Request"
                                        });
                                    });
                                } else {
                                    logger.error('User is not authorized to perform this operation');
                                    return res.status(400).json({ message: 'Bad request' });
                                }
                            } else {
                                logger.error('User not found');
                                return res.status(400).json({ message: 'Bad request' });
                            }
                        })
                        sdc.timing('put.userdb.timer', dbtimer);
                    }
                } else {
                    logger.error('Request type must be JSON');
                    res.status(400).json({ msg: 'Bad Request' });
                }
            } else {
                logger.error('Not a valid user');
                res.status(400).json({ msg: 'Bad Request' });
            }
        } else {
            logger.error('Unauthorized');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('put.user.timer', timer);
    });

    app.use('/v1/user', router);

};