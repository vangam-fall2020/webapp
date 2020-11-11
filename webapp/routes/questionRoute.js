const db = require("../models");
const Question = db.question;
const Category = db.category;
const Answer = db.answer;
const File = db.file;
const questionCategories = db.questionCategories;
const uuid = require('uuid');
const moment = require('moment');
let userAuth = require('../services/authentication');
const { use } = require("../../server");
const { category } = require("../models");
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

    // Create a new Question
    router.post("/question", userAuth.basicAuth, (req, res) => {
        sdc.increment('POST Question Triggered');
        let timer = new Date();
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
                    categories.forEach(cat => {
                        if (pattern.test(cat.category)) {
                            logger.error('Error in Category format');
                            return res.status(400).json({ msg: 'Bad Request' });
                        }
                    })
                    if (question_text == null || categories == null ||
                        question_text == "" || categories == "") {
                        logger.error('Input fields should not be null');
                        return res.status(400).json({ msg: 'Bad Request' });
                    } else {
                        let dbtimer = new Date();
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
                                categories.forEach(cat => {
                                    let dbtimerCategory = new Date();
                                    Category.findOne({ where: { category: cat.category.toLowerCase() } })
                                        .then(category => {
                                            if (category) {
                                                question.addCategory(category);
                                            } else {
                                                let dbtimerCategory1 = new Date();
                                                Category.create({
                                                    category_id: category_id,
                                                    category: cat.category.toLowerCase()
                                                }).then(data => {
                                                    logger.info('New category added successfully');
                                                    question.addCategory(data);
                                                })
                                                sdc.timing('post.categorydb.timer', dbtimerCategory1);
                                            }

                                        }).catch(err => {
                                            logger.error('Category not found');
                                            res.status(400).json({ msg: 'Bad Request' });
                                        })
                                    sdc.timing('get.categorydb.timer', dbtimerCategory);
                                })
                                res.status(200).send(
                                    {
                                        question_id: question.question_id,
                                        created_timestamp: question.created_timestamp,
                                        updated_timestamp: question.updated_timestamp,
                                        user_id: question.user_id,
                                        question_text: question.question_text,
                                        categories: categories,
                                        answers: []
                                    }
                                );
                            }).catch(err => {
                                logger.error('Error in creating question ' + err);
                                res.status(400).json({ msg: 'Bad Request' });
                            })
                        sdc.timing('post.questiondb.timer', dbtimer);
                    }
                } else {
                    logger.error('Request type must be JSON');
                    res.status(400).json({ msg: 'Bad Request' });
                }
            } else {
                res.status(400).json({ msg: 'Bad Request' });
            }
        } else {
            logger.warn('Unauthorized');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('post.question.timer', timer);
    });

    // GET a all questions with given id.
    router.get("/questions", (req, res) => {
        sdc.increment('GET Question Triggered');
        let timer = new Date();
        Question.findAll({
            include: [{
                model: Category,
                through: { atributes: [] }
            }, Answer, File]
        })
            .then(data => {
                res.status(200).send({
                    data
                });
            })
            .catch(err => {
                logger.error('Error in retrieving all questions' + err);
                res.status(404).send({
                    message: "Not Found"
                });
            });
        sdc.timing('get.question.timer', timer);
        sdc.timing('get.questiondb.timer', timer);
    });

    // GET a Question with given id.
    router.get("/question/:id", (req, res) => {
        sdc.increment('GET Question Triggered');
        let timer = new Date();
        Question.findByPk(req.params.id, { include: [Category, File] })
            .then(data => {
                let dbtimer = new Date();
                Answer.findAll({ where: { question_id: data.question_id } })
                    .then(answer => {
                        for (let i = 0; i < answer.length; i++) {
                            data.dataValues['answers'] = answer;
                        }
                        res.status(200).send({
                            data
                        });
                    })
                sdc.timing('get.answer.timer', timer);
                sdc.timing('get.answerdb.timer', timer);
            })
            .catch(err => {
                logger.error('Invalid question Id: ' + req.params.id);
                res.status(404).send({
                    message: "Not Found"
                });
            });
        sdc.timing('get.question.timer', timer);
        sdc.timing('get.questiondb.timer', timer);

    });
    // Update a Question
    router.put("/question/:id", userAuth.basicAuth, (req, res) => {
        sdc.increment('PUT Question Triggered');
        let timer = new Date();
        if (res.locals.user) {
            if (Object.keys(req.body).length > 0) {
                let contentType = req.headers['content-type'];
                if (contentType == 'application/json') {

                    let question_text = req.body.question_text;
                    let categories = req.body.categories;
                    let category_id = uuid.v4();
                    var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
                    categories.forEach(cat => {
                        if (pattern.test(cat.category)) {
                            logger.error('Invalid category format');
                            return res.status(400).json({ msg: 'Bad Request' });
                        }
                    })
                    if ((question_text == null && categories == null)
                        || (question_text == "" && categories == "")) {
                        logger.error('Input fileds should not be null');
                        return res.status(400).json({ msg: 'Bad Request' });
                    } else {
                        let dbtimer = new Date();
                        Question.findByPk(req.params.id)
                            .then(question => {
                                if (question) {
                                    if (res.locals.user.id == question.user_id) {
                                        questionCategories.destroy({ where: { question_id: question.question_id } })
                                            .then(data => { }).catch(err => { })
                                        if (question_text && categories) {
                                            categories.forEach(cat => {
                                                let dbtimer = new Date();
                                                Category.findOne({ where: { category: cat.category.toLowerCase() } })
                                                    .then(cat1 => {
                                                        if (cat1) {
                                                            let dbtimer1 = new Date();
                                                            question.update({
                                                                updated_timestamp: moment().format(),
                                                                question_text: question_text,
                                                            }).then(que => {
                                                                que.addCategory(cat1);
                                                            }).catch(err => {
                                                                logger.error('Question not updated: ' + err);
                                                                res.status(400).send({
                                                                    message: "Bad Request"
                                                                });
                                                            });
                                                            sdc.timing('put.questiondb.timer', dbtimer1);

                                                        } else {
                                                            let dbtimer1 = new Date();
                                                            Category.create({
                                                                category_id: uuid.v4(),
                                                                category: cat.category.toLowerCase()
                                                            }).then(cat2 => {
                                                                logger.info('New category created successfully');
                                                                let queTimer = new Date();
                                                                question.update({
                                                                    updated_timestamp: moment().format(),
                                                                    question_text: question_text,
                                                                }).then(que => {
                                                                    que.addCategory(cat2);
                                                                }).catch(err => {
                                                                    logger.error(err);
                                                                    res.status(400).send({
                                                                        message: "Bad Request"
                                                                    });
                                                                });
                                                                sdc.timing('put.questiondb.timer', queTimer);
                                                            }).catch(err => {
                                                                logger.error('Error creating new Category: ' + err);
                                                                res.status(400).send({
                                                                    message: "Bad Request"
                                                                });
                                                            })
                                                            sdc.timing('post.categorydb.timer', dbtimer1);
                                                        }
                                                    })
                                                sdc.timing('get.categorydb.timer', dbtimer);
                                                res.status(204).send();
                                            })

                                        } else if (question_text) {
                                            let dbtimer = new Date();
                                            question.update({
                                                updated_timestamp: moment().format(),
                                                question_text: question_text,

                                            }).then(data => {
                                                res.status(204).send({ message: 'No Content' });
                                            }).catch(err => {
                                                logger.error('Question cannot be updated: ' + err);
                                                res.status(400).send({
                                                    message: "Bad Request"
                                                });
                                            });
                                            sdc.timing('put.questiondb.timer', dbtimer);

                                        } else if (categories.length !== 0) {

                                            categories.forEach(cat => {
                                                let dbtimer2 = new Date();
                                                Category.findOne({ where: { category: cat.category.toLowerCase() } })
                                                    .then(cat1 => {
                                                        if (cat1) {
                                                            question.addCategory(cat1);
                                                        } else {
                                                            let timer1 = new Date();
                                                            Category.create({
                                                                category_id: uuid.v4(),
                                                                category: cat.category.toLowerCase()
                                                            }).then(cat2 => {
                                                                question.addCategory(cat2);
                                                            }).catch(err => {
                                                                logger.error('Error creating new Category: ' + err);
                                                                res.status(400).json({ message: 'Bad request' });
                                                            })
                                                            sdc.timing('post.categorydb.timer', timer1);
                                                        }
                                                    }).catch(err => {
                                                        logger.error('Cannot find Category: ' + cat.category);
                                                    });
                                                sdc.timing('get.categorydb.timer', dbtimer2);
                                            })
                                            res.status(204).send({ message: 'No Content' });
                                        }
                                    } else {
                                        logger.warn('Unauthorized');
                                        return res.status(401).json({ msg: 'Unauthorized' });
                                    }
                                } else {
                                    logger.error('Question not found');
                                    return res.status(404).json({ message: 'Not Found' });
                                }
                            }).catch(err => {
                                logger.error('Question not found: ' + err);
                                res.status(404).send({
                                    message: "Not Found"
                                });
                            })
                        sdc.timing('get.questiondb.timer', dbtimer);
                    }
                } else {
                    logger.error('Request type must be JSON');
                    return res.status(400).json({ msg: 'Bad Request' });
                }
            } else {
                return res.status(400).json({ msg: 'Bad Request' });
            }
        } else {
            logger.warn('Unauthorized');
            return res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('put.question.timer', timer);
    });

    router.delete("/question/:qid", userAuth.basicAuth, (req, res) => {
        sdc.increment('DELETE Question Triggered');
        let timer = new Date();
        if (res.locals.user) {
            Question.findByPk(req.params.qid)
                .then(question => {
                    if (res.locals.user.id == question.user_id) {
                        let dbtimer1 = new Date();
                        Answer.findAll({ where: { question_id: question.question_id } })
                            .then(answer => {
                                if (answer.length !== 0) {
                                    return res.status(400).json({ msg: 'Bad Request' });
                                } else {
                                    let dbtimer2 = new Date();
                                    question.destroy({ where: { question_id: req.params.qid } })
                                        .then(data => {
                                            res.status(204).send();
                                        }).catch(err => {
                                        });
                                    sdc.timing('delete.questiondb.timer', dbtimer2);
                                }
                            }).catch(err => {
                                logger.error(err);
                                res.status(400).send({
                                    message: "Bad Request"
                                });
                            });
                        sdc.timing('get.answer.timer', dbtimer1);
                    } else {
                        logger.warn('Unauthorized');
                        return res.status(400).json({ msg: 'Bad Request' });
                    }
                }).catch(err => {
                    logger.error(err);
                    res.status(404).send({
                        message: "Not Found"
                    });
                });
            sdc.timing('get.questiondb.timer', timer);
        } else {
            logger.warn('Unauthorized');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('delete.question.timer', timer);
    });

    app.use('/v1', router);

};