const db = require("../models");
const Question = db.question;
const User = db.users;
const Category = db.category;
const uuid = require('uuid');
const moment = require('moment');
let userAuth = require('../services/authentication');
const { use } = require("../../server");
const { category } = require("../models");
const router = require("express").Router();

// Api calls to protected routes
module.exports = app => {

    // Create a new User
    router.post("/question", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {
                    var question_text = req.body.question_text;
                    var categories = req.body.categories;
                    let user_id = res.locals.user.id;
                    const created_timestamp = moment().format();
                    const updated_timestamp = moment().format();
                    let id = uuid.v4();
                    let category_id = uuid.v4();

                    var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);

                    if (question_text == null || categories == null ||
                        question_text == "" || categories == "") {
                        return res.status(400).json({ msg: 'Bad Request' });
                    }
                    else if (pattern.test(categories[0].category)) {
                        return res.status(400).json({ msg: 'Bad Request' });
                    }
                    else {
                        console.log("category: ", categories[0].category);
                        let category_lowercase = categories[0].category.toLowerCase();
                        Category.create({
                            category_id: category_id,
                            category: categories[0].category.toLowerCase()
                        }).then((cat) => {
                            console.log("cat data : ", cat);
                            console.log("user id: ", user_id);
                            Question.create({
                                question_id: id,
                                created_timestamp: created_timestamp,
                                updated_timestamp: updated_timestamp,
                                user_id: user_id,
                                question_text: question_text,
                            }, {
                                include: Category
                            })
                                .then(question => {
                                    question.addCategory(cat);
                                    res.status(201).send({
                                        question_id: question.question_id,
                                        created_timestamp: question.created_timestamp,
                                        updated_timestamp: question.updated_timestamp,
                                        user_id: question.user_id,
                                        question_text: question.question_text,
                                        categories: [{
                                            category_id: cat.category_id,
                                            category: cat.catogory
                                        }]
                                    });
                                })
                                .catch(err => {
                                    console.log("category exists: ", err);
                                    res.status(400).send({
                                        message: "Bad Request"
                                    });
                                });

                        }).catch((err) => {
                            res.status(400).send({
                                message: "Bad Request"
                            });
                        });

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

    // GET a User with given id.
    router.get("/questions", (req, res) => {

        // Save User in the database
        Question.findAll()
            .then(data => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(data);
            })
            .catch(err => {
                res.status(404).send({
                    message: "Not Found"
                });
            });

    });

    // GET a User with given id.
    router.get("/question/:id", (req, res) => {

        // Save User in the database
        Question.findByPk(req.params.id)
            .then(data => {
                res.status(200).send({
                    question_id: data.question_id,
                    created_timestamp: data.created_timestamp,
                    updated_timestamp: data.updated_timestamp,
                    user_id: data.user_id,
                    question_text: data.question_text,
                    categories: [
                        {
                            category_id: data.categories.category_id,
                            category: data.categories.category
                        }
                    ],
                    answers: [
                        {
                            answer_id: data.answer_id,
                            question_id: data.question_id,
                            created_timestamp: data.created_timestamp,
                            updated_timestamp: data.updated_timestamp,
                            user_id: data.user_id,
                            answer_text: data.answer_text
                        }
                    ]
                });
            })
            .catch(err => {
                res.status(404).send({
                    message: "Not Found"
                });
            });

    });
    // Update a user
    router.put("/question/:id", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {
                    let question_text = req.body.question_text;
                    let categories = req.body.categories;
                    let category_id = uuid.v4();

                    if ((question_text == null && categories == null)
                        || (question_text == "" && categories == "")) {
                        return res.status(400).json({ msg: 'Bad Request' });
                    } else {
                        console.log("req id: ", req.params.id);
                        Question.findByPk(req.params.id)
                            .then(question => {
                                if (question) {
                                    if (question_text && categories) {
                                        Category.findOne({ where: { category: categories[0].category } })
                                            .then(cat => {
                                                if (cat) {
                                                    cat.update({
                                                        catogory: cat.catogory

                                                    }).then({

                                                    }).catch(err => {
                                                        res.status(400).send({
                                                            message: "Bad Request"
                                                        });
                                                    })
                                                    console.log("cat exists: ", cat);
                                                    question.update({

                                                        updated_timestamp: moment().format(),
                                                        question_text: question_text,

                                                    }).then(data => {
                                                        res.status(204).send({ message: 'No Content' });
                                                    }).catch(err => {
                                                        console.log("BR 1");
                                                        res.status(400).send({
                                                            message: "Bad Request"
                                                        });
                                                    });
                                                } else {
                                                    console.log("cat creation");
                                                    Category.create({
                                                        category_id: category_id,
                                                        category: categories[0].category.toLowerCase()
                                                    }).then(cat => {
                                                        console.log("cat created: ", cat);
                                                        question.update({
                                                            updated_timestamp: moment().format(),
                                                            question_text: question_text,

                                                        }).then(question => {
                                                            question.addCategory(cat);
                                                            console.log("ques: ", question);
                                                            console.log("cat:", cat);
                                                            res.status(204).send({ message: 'No Content' });
                                                        }).catch(err => {
                                                            console.log("BR 2");
                                                            res.status(400).send({
                                                                message: "Bad Request"
                                                            });
                                                        });
                                                    }).catch(err => {
                                                        console.log("BR 3");
                                                        res.status(400).json({ message: 'Bad request' });
                                                    })
                                                }
                                            }).catch(err => {
                                                console.log("BR 4");
                                                res.status(400).json({ message: 'Bad request' });
                                            });

                                    }
                                    // else if(categories){
                                    //     Category.findOne({ where: { category: categories[0].category } })
                                    //     .then(cat=>{
                                    //         cat.update({
                                    //             catogory: cat.catogory

                                    //     }).then(data=>{
                                    //         res.status(204).send({ message: 'No Content' });
                                    //     }).catch(err=>{
                                    //         res.status(400).send({
                                    //             message: "Bad Request"
                                    //         });
                                    //     })
                                    //     })
                                    // }

                                } else {
                                    return res.status(404).json({ message: 'Not Found' });
                                }
                            }).catch(err => {
                                console.log("BR 5");
                                res.status(404).send({
                                    message: "Not Found"
                                });
                            })
                    }
                } else {
                    console.log("BR 6");
                    res.status(400).json({ msg: 'Bad Request' });
                }
            } else {
                console.log("BR 7");
                res.status(400).json({ msg: 'Bad Request' });
            }
        } else {
            res.status(401).json({ msg: 'Unauthorized' });
        }
    });

    router.delete("/question/:qid", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {

            Question.findByPk(req.params.qid)
                .then(question => {
                    question.destroy({ where: { question_id: req.params.qid } })
                        .then(data => {
                            res.status(204).send();
                        }).catch(err => {
                            console.log("err: ", err);
                        });
                }).catch(err => {
                    res.status(404).send({
                        message: "Not Found"
                    });
                });
        } else {
            res.status(401).json({ msg: 'Unauthorized' });
        }
    });

    app.use('/v1', router);

};