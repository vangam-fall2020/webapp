const db = require("../models");
const Question = db.question;
const User = db.users;
const Category = db.category;
const Answer = db.answer;
const uuid = require('uuid');
const moment = require('moment');
const saltRounds = 10;
let userAuth = require('../services/authentication');
const { use } = require("../../server");
const { category, answer } = require("../models");
const router = require("express").Router();

// Api calls to protected routes
module.exports = app => {

    router.post("/:id/answer", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {
                    var answer_text = req.body.answer_text;
                    let user_id = res.locals.user.id;
                    if (answer_text == null || answer_text == "") {
                        return res.status(400).json({ msg: 'Bad Request' });
                    }
                    else {
                        Question.findByPk(req.params.id)
                            .then(question => {
                                if (question) {
                                    Answer.create({
                                        question_question_id: question_id,
                                        question_id: question.question_id,
                                        created_timestamp: moment().format(),
                                        updated_timestamp: moment().format(),
                                        user_id: user_id,
                                        answer_text: answer_text
                                    }).then(answer => {
                                        res.status(201).send({
                                            answer_id: answer.answer_id,
                                            question_id: question.question_id,
                                            created_timestamp: answer.created_timestamp,
                                            updated_timestamp: answer.updated_timestamp,
                                            user_id: answer.user_id,
                                            answer_text: answer.answer_text

                                        });
                                    }).catch(err => {
                                        res.status(400).send({
                                            message: "Bad Request"
                                        });
                                    })
                                } else {
                                    return res.status(400).json({ message: 'Bad Request' });
                                }
                            }).catch(err => {
                                res.status(400).send({
                                    message: "Bad Request"
                                });
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

    router.get("/:qid/answer/:aid", (req, res) => {

        Answer.findByPk(req.params.aid)
            .then(data => {
                if (data.question_id == req.params.qid) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(data);
                } else {
                    res.status(404).send({
                        message: "Not Found"
                    });
                }

            })
            .catch(err => {
                res.status(404).send({
                    message: "Not Found"
                });
            });

    });

    router.put("/:qid/answer/:aid", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {
                    let answer_text = req.body.answer_text;
                    if ((answer_text == null || answer_text == "")) {
                        return res.status(400).json({ msg: 'Bad Request' });
                    } else {
                        Answer.findByPk(req.params.aid)
                            .then(answer => {
                                if (res.locals.user.id == answer.user_id) {
                                    answer.update({
                                        updated_timestamp: moment().format(),
                                        answer_text: answer_text
                                    }).then(data => {
                                        res.status(204).send({});
                                    }).catch(err => {
                                        res.status(404).send({
                                            message: "Not Found"
                                        });
                                    });
                                } else {
                                    return res.status(400).send({
                                        message: "Bad Request"
                                    });
                                }
                            });
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

    router.delete("/:qid/answer/:aid", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {
            Answer.findByPk(req.params.aid)
                .then(answer => {
                    if (res.locals.user.id == answer.user_id) {
                        answer.destroy({ where: { answer_id: req.params.aid } })
                            .then(data => {
                                res.status(204).send();
                            }).catch(err => {
                                
                            });
                    } else {
                        return res.status(400).send({
                            message: "Bad Request"
                        });
                    }
                }).catch(err => {
                    res.status(404).send({
                        message: "Not Found"
                    });
                });
        } else {
            returnres.status(401).json({ msg: 'Unauthorized' });
        }
    });

    app.use('/v1/question', router);

};