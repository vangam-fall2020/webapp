const db = require("../models");
const User = db.users;
const emailValidator = require('email-validator');
const validator = require('../services/password_validation');
const bcrypt = require('bcrypt');
const moment = require('moment');
const saltRounds = 10;
let userAuth = require('../services/authentication');
const router = require("express").Router();

// Api calls to protected routes
module.exports = app => {

    // Create a new User
    router.post("/", (req, res, next) => {
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
                        console.log("err: ", err);
                        res.status(400).send({
                            message: "Bad Request"
                        });
                    });

            }
            else if (firstName == null || lastName == null || password == null || emailAddress == null
                || firstName == "" || lastName == "" || password == "" || emailAddress == "") {
                res.status(400).json({ msg: 'Please enter all details!' });
            }
            else if (emailValidator.validate(emailAddress) == false) {
                res.status(400).json({ msg: `${emailAddress} is not a valid email address!` });
            }
            else {
                res.status(400).json({
                    msg: 'Password must contain a lowercase, an uppercase,a digit and must be atleast 8 letters & a symbol! NO Spaces Allowed'
                });
            }
        }
        else {
            res.status(400).json({ msg: 'Request type must be JSON!' });
        }
    });

    // Retrieve all users
    router.get("/self", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(res.locals.user);

        }else {
            res.status(401).json({ msg: 'Unauthorized' });
        }
    });

    // GET a User with given id.
    router.get("/:id", (req, res, next) => {

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
                res.status(404).send({
                    message: "Not Found"
                });
            });

    });

    // Update a user
    router.put("/self", userAuth.basicAuth, (req, res) => {
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
                        return res.status(400).json({ msg: 'Bad Request' });
                    }
                    if (first_name == null || last_name == null || username == null || password == null ||
                        first_name == "" || last_name == "" || username == "" || password == "") {
                        return res.status(400).json({ msg: 'Bad Request' });
                    } else {
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
                                    return res.status(400).json({ message: 'Bad request' });
                                }
                            } else {
                                return res.status(400).json({ message: 'Bad request' });
                            }
                        })
                    }
                } else {
                    res.status(400).json({ msg: 'Bad Request' });
                }
            } else {
                res.status(400).json({ msg: 'Bad Request' });
            }
        } else {
            res.status(401).json({ msg: 'Unauthorized' });
        }
    });

    app.use('/v1/user', router);

};