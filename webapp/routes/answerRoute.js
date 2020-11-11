const db = require("../models");
const Question = db.question;
const User = db.users;
const Category = db.category;
const Answer = db.answer;
const File = db.file;
const uuid = require('uuid');
const moment = require('moment');
const saltRounds = 10;
let userAuth = require('../services/authentication');
const { use } = require("../../server");
const { category, answer } = require("../models");
const router = require("express").Router();

const SDC = require('statsd-client'),
    sdc = new SDC({ host: 'localhost', port: 8125 });
const log4js = require('log4js');
log4js.configure({
    appenders: { logs: { type: 'file', filename: '/home/ubuntu/webapp/logs/webapp.log' } },
    categories: { default: { appenders: ['logs'], level: 'info' } }
});
const logger = log4js.getLogger('logs');

// Api calls to protected routes
module.exports = app => {

    router.post("/:id/answer", userAuth.basicAuth, (req, res) => {
        sdc.increment('POST Answer Triggered');
        let timer = new Date();
        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {
                    var answer_text = req.body.answer_text;
                    let user_id = res.locals.user.id;
                    if (answer_text == null || answer_text == "") {
                        logger.error('Input data should not be null or empty');
                        return res.status(400).json({ msg: 'Bad Request' });
                    }
                    else {
                        let questiontimer = new Date();
                        Question.findByPk(req.params.id)
                            .then(question => {
                                if (question) {
                                    let answertimer = new Date();
                                    Answer.create({
                                        question_question_id: question.question_id,
                                        question_id: question.question_id,
                                        created_timestamp: moment().format(),
                                        updated_timestamp: moment().format(),
                                        user_id: user_id,
                                        answer_text: answer_text
                                    }).then(answer => {
                                        logger.info('Answer added to Question successfully, answer_id: '+ answer.answer_id);
                                        question.addAnswer(answer);
                                        res.status(201).send({
                                            answer_id: answer.answer_id,
                                            question_id: question.question_id,
                                            created_timestamp: answer.created_timestamp,
                                            updated_timestamp: answer.updated_timestamp,
                                            user_id: answer.user_id,
                                            answer_text: answer.answer_text

                                        });
                                    }).catch(err => {
                                        logger.error(err);
                                        res.status(400).send({
                                            message: "Bad Request"
                                        });
                                    })
                                    sdc.timing('post.answerdb.timer', timer);
                                } else {
                                    logger.error('Invalid Question Id in URL');
                                    return res.status(400).json({ message: 'Bad Request' });
                                }
                            }).catch(err => {
                                logger.error('Invalid Question Id: '+ err);
                                res.status(400).send({
                                    message: "Bad Request"
                                });
                            })
                        sdc.timing('get.questiondb.timer', questiontimer);
                    }
                } else {
                    logger.error('Request type must be JSON');
                    res.status(400).json({ msg: 'Bad Request' });
                }
            } else {
                logger.error('Invalid User credentials');
                res.status(400).json({ msg: 'Bad Request' });
            }
        } else {
            logger.warn('User is Unauthorized');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('post.answer.timer', timer);
    });

    router.get("/:qid/answer/:aid", (req, res) => {
        sdc.increment('GET Answer Triggered');
        let timer = new Date();
        Answer.findByPk(req.params.aid, { include: File })
            .then(data => {
                if (data.question_id == req.params.qid) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(data);
                } else {
                    logger.error('Invalid Question Id - '+ req.params.qid);
                    res.status(404).send({
                        message: "Not Found"
                    });
                }

            })
            .catch(err => {
                logger.error('Invalid Question Id - '+ err);
                res.status(404).send({
                    message: "Not Found"
                });
            });
        sdc.timing('get.answer.timer', timer);
    });

    router.put("/:qid/answer/:aid", userAuth.basicAuth, (req, res) => {
        sdc.increment('PUT Answer Triggered');
        let timer = new Date();
        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {
                    let answer_text = req.body.answer_text;
                    if((answer_text == null || answer_text == "")) {
                        logger.error('Input data should not be null or empty');
                        return res.status(400).json({ msg: 'Bad Request' });
                    }else {
                        let answertimer = new Date();
                        Answer.findByPk(req.params.aid)
                            .then(answer => {
                                if (res.locals.user.id == answer.user_id) {
                                    answer.update({
                                        updated_timestamp: moment().format(),
                                        answer_text: answer_text
                                    }).then(data => {
                                        logger.info('Answer updated successfully: '+ answer.answer_id);
                                        res.status(204).send({});
                                    }).catch(err => {
                                        logger.error(err);
                                        res.status(404).send({
                                            message: "Not Found"
                                        });
                                    });
                                } else {
                                    logger.error('User is not authorized to perform this operation');
                                    return res.status(400).send({
                                        message: "Bad Request"
                                    });
                                }
                            });
                        sdc.timing('get.answerdb.timer', answertimer);
                    }
                } else {
                    logger.error('Request type must be JSON');
                    return res.status(400).json({ msg: 'Bad Request' });
                }
            } else {
                logger.error('Invalid User credentials');
                return res.status(400).json({ msg: 'Bad Request' });
            }
        } else {
            logger.warn('User is Unauthorized');
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('put.answer.timer', timer);
    });

    router.delete("/:qid/answer/:aid", userAuth.basicAuth, (req, res) => {
        sdc.increment('DELETE Answer Triggered');
        let timer = new Date();
        if (res.locals.user) {
            Answer.findByPk(req.params.aid)
                .then(answer => {
                    if (res.locals.user.id == answer.user_id) {
                        let answertimer = new Date();
                        answer.destroy({ where: { answer_id: req.params.aid } })
                            .then(data => {
                                logger.info('Answer Deleted successfully. Deleted Answer: '+ request.params.aid);
                                res.status(204).send();
                            }).catch(err => {
                                logger.error(err);
                            });
                        sdc.timing('delete.answerdb.timer', answertimer);
                    } else {
                        logger.error('User is not authorized to perform this operation');
                        return res.status(400).send({
                            message: "Bad Request"
                        });
                    }
                }).catch(err => {
                    logger.error(err);
                    res.status(404).send({
                        message: "Not Found"
                    });
                });

        } else {
            logger.warn('Unauthorized User');
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('delete.answer.timer', timer);
    });

    app.use('/v1/question', router);

};