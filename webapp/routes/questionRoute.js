const db = require("../models");
const Question = db.question;
const Category = db.category;
const Answer = db.answer;
const uuid = require('uuid');
const moment = require('moment');
let userAuth = require('../services/authentication');
const { use } = require("../../server");
const { category } = require("../models");
const router = require("express").Router();

// Api calls to protected routes
module.exports = app => {

    // Create a new Question
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
                        Category.findOne({ where: { category: categories[0].category.toLowerCase() } })
                            .then(category => {
                                if (category) {
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
                                            question.addCategory(category);
                                            res.status(201).send({
                                                question_id: question.question_id,
                                                created_timestamp: question.created_timestamp,
                                                updated_timestamp: question.updated_timestamp,
                                                user_id: question.user_id,
                                                question_text: question.question_text,
                                                categories: [{
                                                    category_id: category.category_id,
                                                    category: category.category
                                                }]
                                            });
                                        })
                                        .catch(err => {
                                            console.log("err: ", err);
                                            res.status(400).send({
                                                message: "Bad Request"
                                            });
                                        });
                                } else {
                                    Category.create({
                                        category_id: category_id,
                                        category: categories[0].category.toLowerCase()
                                    }).then((cat) => {

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
                                                        category: cat.category
                                                    }]
                                                });
                                            })
                                            .catch(err => {
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

    // GET a all questions with given id.
    router.get("/questions", (req, res) => {

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

    // GET a Question with given id.
    router.get("/question/:id", (req, res) => {
        Question.findByPk(req.params.id, { include: Category })
            .then(data => {
                Answer.findAll({ where: { question_id: data.question_id } })
                    .then(answer => {
                        for (let i = 0; i < answer.length; i++) {
                            data.dataValues['answers'] = answer;
                        }
                        res.status(200).send({
                            data
                        });
                    })
            })
            .catch(err => {
                res.status(404).send({
                    message: "Not Found"
                });
            });

    });
    // Update a Question
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
                        Question.findByPk(req.params.id)
                            .then(question => {
                                if (question) {
                                    if (res.locals.user.id == question.user_id) {
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
                                                        question.update({

                                                            updated_timestamp: moment().format(),
                                                            question_text: question_text,

                                                        }).then(data => {
                                                            question.addCategory(cat);
                                                            res.status(204).send({ message: 'No Content' });
                                                        }).catch(err => {
                                                            res.status(400).send({
                                                                message: "Bad Request"
                                                            });
                                                        });
                                                    } else {
                                                        Category.create({
                                                            category_id: category_id,
                                                            category: categories[0].category.toLowerCase()
                                                        }).then(cat => {
                                                            question.update({
                                                                updated_timestamp: moment().format(),
                                                                question_text: question_text,

                                                            }).then(question => {
                                                                question.addCategory(cat);
                                                                res.status(204).send({ message: 'No Content' });
                                                            }).catch(err => {
                                                                res.status(400).send({
                                                                    message: "Bad Request"
                                                                });
                                                            });
                                                        }).catch(err => {
                                                            res.status(400).json({ message: 'Bad request' });
                                                        })
                                                    }
                                                }).catch(err => {
                                                    res.status(400).json({ message: 'Bad request' });
                                                });

                                        }
                                    } else {
                                        return res.status(400).json({ msg: 'Bad Request' });
                                    }
                                } else {
                                    return res.status(404).json({ message: 'Not Found' });
                                }
                            }).catch(err => {
                                res.status(404).send({
                                    message: "Not Found"
                                });
                            })
                    }
                } else {
                    return res.status(400).json({ msg: 'Bad Request' });
                }
            } else {
                return res.status(400).json({ msg: 'Bad Request' });
            }
        } else {
            return res.status(401).json({ msg: 'Unauthorized' });
        }
    });

    router.delete("/question/:qid", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {

            Question.findByPk(req.params.qid)
                .then(question => {
                    if (res.locals.user.id == question.user_id) {
                        question.destroy({ where: { question_id: req.params.qid } })
                            .then(data => {
                                res.status(204).send();
                            }).catch(err => {
                            });
                    } else {
                        return res.status(400).json({ msg: 'Bad Request' });
                    }
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