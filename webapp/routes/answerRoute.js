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
const { deleteFromS3 } = require('../services/image');

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

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
        var email_address;
        let topicARN;
        let topic = {};
        var sns = new AWS.SNS();
        // let header = req.headers['authorization'] || '',
        //     token = header.split(/\s+/).pop() || '',
        //     authFromToken = new Buffer.from(token, 'base64').toString(),
        //     user_data = authFromToken.split(/:/),
        //     email_address = user_data[0];

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
                                    User.findOne({where: { id : question.user_id }})
                                    .then(user=>{
                                        email_address = user.username;
                                        logger.info("email_address: ", email_address);
                                    })
                                    .catch(err=>{
                                        logger.info('Error: ', err);
                                    })
                                    let answertimer = new Date();
                                    Answer.create({
                                        question_question_id: question.question_id,
                                        question_id: question.question_id,
                                        created_timestamp: moment().format(),
                                        updated_timestamp: moment().format(),
                                        user_id: user_id,
                                        answer_text: answer_text
                                    }).then(answer => {
                                        logger.info('Answer added to Question successfully, answer_id: ' + answer.answer_id);
                                        question.addAnswer(answer);

                                        sns.listTopics(topic, (err, data) => {
                                            if (err) {
                                                logger.error('err in sns listTopics', err);
                                                console.log("err: ", err);

                                            }
                                            else {
                                                logger.info("email: ", email_address);

                                                topicARN = data.Topics[0].TopicArn;
                                                let messageJson = {
                                                    "answer": JSON.stringify(answer),
                                                    "email": (email_address),
                                                    "question_id": answer.question_id,
                                                    "answer_id": answer.answer_id,
                                                    "message": "Posted new Answer to question '" + question.question_text + "'"
                                                }
                                                var defaultMessage = { "default": messageJson };
                                                let params = {
                                                    TopicArn: topicARN,
                                                    MessageStructure: 'json',
                                                    Message: JSON.stringify({ "default": JSON.stringify(messageJson) })

                                                };
                                                logger.info('params --- ' + params);
                                                sns.publish(params, (err, data) => {
                                                    if (err) {
                                                        logger.error('error in SNS publish', err);

                                                    } else {
                                                        logger.info('SNS publish success', data)
                                                        console.log('SNS publish success', data);

                                                    }
                                                })
                                                console.log(data.Topics);
                                            }
                                        })

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
                                    sdc.timing('post.answerdb.timer', answertimer);
                                } else {
                                    logger.error('Invalid Question Id in URL');
                                    return res.status(400).json({ message: 'Bad Request' });
                                }
                            }).catch(err => {
                                logger.error('Invalid Question Id: ' + err);
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
                    logger.error('Invalid Question Id - ' + req.params.qid);
                    res.status(404).send({
                        message: "Not Found"
                    });
                }

            })
            .catch(err => {
                logger.error('Invalid Question Id - ' + err);
                res.status(404).send({
                    message: "Not Found"
                });
            });
        sdc.timing('get.answer.timer', timer);
    });

    router.put("/:qid/answer/:aid", userAuth.basicAuth, (req, res) => {
        sdc.increment('PUT Answer Triggered');
        let timer = new Date();

        let topicARN;
        let topic = {};
        var sns = new AWS.SNS();
        // let header = req.headers['authorization'] || '',
        //     token = header.split(/\s+/).pop() || '',
        //     authFromToken = new Buffer.from(token, 'base64').toString(),
        //     user_data = authFromToken.split(/:/),
        var email_address;

        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {
                    let answer_text = req.body.answer_text;
                    if ((answer_text == null || answer_text == "")) {
                        logger.error('Input data should not be null or empty');
                        return res.status(400).json({ msg: 'Bad Request' });
                    } else {
                        let answertimer = new Date();
                        Answer.findByPk(req.params.aid)
                            .then(answer => {
                                if (res.locals.user.id == answer.user_id) {
                                    answer.update({
                                        updated_timestamp: moment().format(),
                                        answer_text: answer_text
                                    }).then(data1 => {
                                        logger.info('Answer updated successfully: ' + answer.answer_id);
                                        
                                        Question.findByPk(answer.question_id)
                                        .then(que=>{
                                            User.findByPk(que.user_id)
                                            .then(user=>{
                                                email_address = user.username;
                                                logger.info("email_address: ", email_address);
                                            })
                                            .catch(err=>{
                                                logger.info('Error: ', err);
                                            })
                                        }).catch(err=>{
                                            logger.info('error: ', err);
                                        })
                                        sns.listTopics(topic, (err, data) => {
                                            if (err) {
                                                logger.error('err in sns listTopics', err);
                                                console.log("err: ", err);

                                            }
                                            else {
                                                logger.info("email: ", email_address);

                                                topicARN = data.Topics[0].TopicArn;
                                                let messageJson = {
                                                    "answer": JSON.stringify(answer),
                                                    "email": (email_address),
                                                    "question_id": answer.question_id,
                                                    "answer_id": answer.answer_id,
                                                    "message": "Updated Answer text - '" + answer_text + "'"
                                                }

                                                let params = {
                                                    TopicArn: topicARN,
                                                    MessageStructure: 'json',
                                                    Message: JSON.stringify({ "default": JSON.stringify(messageJson) })

                                                };
                                                logger.info('params --- ' + params);
                                                sns.publish(params, (err, data) => {
                                                    if (err) {
                                                        logger.error('error in SNS publish', err);

                                                    } else {
                                                        logger.info('SNS publish success', data)
                                                        console.log('SNS publish success', data);

                                                    }
                                                })
                                                console.log(data.Topics);
                                            }
                                        })

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
                            }).catch(err => {
                                logger.error(err);
                                res.status(400).send({
                                    message: "Bad Request"
                                });
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
        var answer_id = req.params.aid;
        let timer = new Date();

        let topicARN;
        let topic = {};
        var sns = new AWS.SNS();
        //var listTopicsPromise = sns.listTopics({}).promise();
        // let header = req.headers['authorization'] || '',
        //     token = header.split(/\s+/).pop() || '',
        //     authFromToken = new Buffer.from(token, 'base64').toString(),
        //     user_data = authFromToken.split(/:/),
        var email_address;

        if (res.locals.user) {
            Answer.findByPk(req.params.aid)
                .then(answer => {
                    if (res.locals.user.id == answer.user_id) {
                        let answertimer = new Date();
                        File.findOne({ where: { answer_id: req.params.aid } })
                            .then(file => {
                                if (file) {

                                    deleteFromS3(file.s3_object_name, function (res1) {
                                        if (res1 != null) {
                                            logger.info('Image deleted from s3');
                                        } else {
                                            logger.warn('cannot delete object from s3');
                                        }
                                    });
                                }
                                Question.findByPk(answer.question_id)
                                .then(que=>{
                                    User.findByPk(que.user_id)
                                            .then(user=>{
                                                email_address = user.username;
                                                logger.info("email_address: ", email_address);
                                            })
                                            .catch(err=>{
                                                logger.info('Error: ', err);
                                            })
                                }).catch(err=>{
                                    logger.info('error: ', err);
                                })
                                answer.destroy({ where: { answer_id: answer_id } })
                                    .then(data1 => {
                                        logger.info('Answer Deleted successfully. Deleted Answer: ' + data1);

                                        sns.listTopics(topic, (err, data) => {
                                            if (err) {
                                                logger.error('err in sns listTopics', err);
                                                console.log("err: ", err);
                                            }
                                            else {
                                                logger.info("email: ", email_address);

                                                topicARN = data.Topics[0].TopicArn;
                                                let messageJson = {
                                                    "answer": JSON.stringify({
                                                        "answer_id": answer.answer_id,
                                                        "question_id": answer.question_id,
                                                        "created_timestamp": answer.created_timestamp,
                                                        "updated_timestamp": answer.updated_timestamp,
                                                        "user_id": answer.user_id,
                                                        "answer_text": "Deleted answer - "+ answer.answer_text

                                                    }),
                                                    "email": (email_address),
                                                    "question_id": answer.question_id,
                                                    "answer_id": answer.answer_id,
                                                    "message": "Deleted Answer- '" + answer.answer_text + "'"
                                                }

                                                let params = {
                                                    TopicArn: topicARN,
                                                    MessageStructure: 'json',
                                                    Message: JSON.stringify({ "default": JSON.stringify(messageJson) })

                                                };
                                                logger.info('params --- ' + params);
                                                sns.publish(params, (err, data) => {
                                                    if (err) {
                                                        logger.error('error in SNS publish', err);

                                                    } else {
                                                        logger.info('SNS publish success', data);
                                                        console.log('SNS publish success', data);

                                                    }
                                                })
                                                console.log(data.Topics);
                                            }
                                        })

                                        res.status(204).send();
                                    }).catch(err => {
                                        logger.error(err);
                                        res.status(400).send({
                                            message: "Bad Request"
                                        });
                                    });
                                sdc.timing('delete.answerdb.timer', answertimer);
                            })
                            .catch(err => {
                                logger.error(err);
                                res.status(400).send({
                                    message: "Bad Request"
                                });
                            });

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
