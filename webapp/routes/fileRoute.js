const { use } = require("../../server");
const db = require("../models");
const Question = db.question;
const User = db.users;
const Answer = db.answer;
const File = db.file;
const express = require('express');
const router = express.Router();
const validator = require('../services/password_validation');
const uuid = require('uuid');
const moment = require('moment');
let userAuth = require('../services/authentication');
const { check, validationResult } = require('express-validator');
const { upload, deleteFromS3, getMetaDataFromS3 } = require('../services/image');
const singleUpload = upload.single('image');
require('dotenv').config({ path: '/home/ubuntu/var/.env' });
const SDC = require('statsd-client'),
    sdc = new SDC({ host: 'localhost', port: 8125 });
const log4js = require('log4js');
// log4js.configure({
//     appenders: { logs: { type: 'file', filename: '/home/ubuntu/webapp/logs/webapp.log' } },
//     categories: { default: { appenders: ['logs'], level: 'info' } }
// });
// const logger = log4js.getLogger('logs');


// Api calls to protected routes
module.exports = app => {

    // Attach file to question
    router.post("/:qid/file", userAuth.basicAuth, (req, res) => {
        sdc.increment('GET File Triggered');

        if (res.locals.user) {
            let timer = new Date();
            let dbtimer = new Date();
            let question_id = req.params.qid;


            if (question_id) {
                Question.findByPk(question_id)
                    .then(question => {
                        if (question && question.user_id == res.locals.user.id) {
                            File.findOne({ where: { question_id: question_id } })
                                .then(file => {


                                    singleUpload(req, res, (err) => {
                                        if (err) {

                                            res.status(400).send({
                                                message: "Bad Request"
                                            });
                                        } else {
                                            let image = {
                                                'id': uuid.v4(),
                                                'url': req.file.location
                                            };

                                            getMetaDataFromS3(function (metadata) {
                                                if (metadata != null) {

                                                    //                                           
                                                    File.create({
                                                        file_id: uuid.v4(),
                                                        file_name: req.file.originalname,
                                                        s3_object_name: req.file.key,
                                                        created_date: moment().format(),
                                                        question_id: question_id,
                                                        metadata: req.file
                                                    })
                                                        .then(image => {

                                                            return res.status(201).send({ image });
                                                        })
                                                        .catch(err => {

                                                            deleteFromS3(req.file.key, function (res1) {
                                                                if (res1 != null) {
                                                                    return res.status(400).json({ msg: 'Bad Request' });
                                                                }
                                                            });

                                                        })
                                                }
                                            });
                                        }
                                    })
                                })
                        } else {
                            res.status(401).json({ msg: 'Unauthorized' });
                        }
                    })
            }
            else {

                return res.status(400).json({ msg: 'Bad Request' });
            }

        } else {
            res.status(401).json({ msg: 'Unauthorized' });
        }
    });

    // Delete file
    router.delete("/:qid/file/:fid", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {
            Question.findByPk(req.params.qid)
                .then(question => {
                    if (question && question.user_id == res.locals.user.id) {
                        File.findByPk(req.params.fid)
                            .then(file => {
                                if (file) {

                                    if (file.question_id == req.params.qid) {
                                        let imageId = file.s3_object_name;

                                        deleteFromS3(imageId, function (res1) {
                                            if (res1 != null) {
                                                File.destroy({ where: { file_id: req.params.fid } })
                                                    .then(file => {

                                                        return res.status(201).json({ msg: "No Content" });
                                                    }).catch(err => {
                                                        return res.status(500).json({ msg: err });
                                                    })
                                            }
                                        });
                                    } else {
                                        return res.status(404).json({ msg: 'Not Found' });
                                    }
                                } else {
                                    return res.status(404).json({ msg: 'Image Not Found!' });
                                }

                            })

                    } else {
                        return res.status(401).json({ msg: 'Unauthorized' })
                    }
                }).catch(err => {
                    return res.status(400).json({ msg: 'Bad Request' })
                }).catch(err => {
                    return res.status(400).json({ msg: 'Bad Request' })
                })

        } else {
            res.status(401).json({ msg: 'Unauthorized' });
        }

    });

    //Delete file attached to answer
    router.delete("/:qid/answer/:aid/file/:fid", userAuth.basicAuth, (req, res) => {
        if (res.locals.user) {
            Answer.findByPk(req.params.aid)
                .then(answer => {
                    if (answer && answer.user_id == res.locals.user.id) {
                        File.findByPk(req.params.fid)
                            .then(file => {
                                if (file) {

                                    if (file.question_id == req.params.qid &&
                                        file.answer_id == req.params.aid) {
                                        let imageId = file.s3_object_name;

                                        deleteFromS3(imageId, function (res) {
                                            if (res != null) {
                                                File.destroy({ where: { file_id: req.params.fid } })
                                                    .then(file => {

                                                        return res.status(201).json({ msg: "No Content" });
                                                    }).catch(err => {
                                                        return res.status(500).json({ msg: err });
                                                    })
                                            }
                                        });
                                    } else {
                                        return res.status(404).json({ msg: 'Not Found' });
                                    }
                                } else {
                                    return res.status(404).json({ msg: 'Image Not Found!' });
                                }

                            }).catch(err => {
                                return res.status(400).json({ msg: 'Bad Request' })
                            })

                    } else {
                        return res.status(401).json({ msg: 'Unauthorized' })
                    }
                }).catch(err => {
                    return res.status(400).json({ msg: 'Bad Request' })
                })

        } else {
            res.status(401).json({ msg: 'Unauthorized' });
        }
    });

    // Post a file to answer
    router.post("/:qid/answer/:aid/file", userAuth.basicAuth, (req, res) => {
        sdc.increment('GET File Triggered');

        if (res.locals.user) {
            let timer = new Date();
            let dbtimer = new Date();
            let answer_id = req.params.aid;

            if (answer_id) {
                Answer.findByPk(answer_id)
                    .then(answer => {
                        if (answer && answer.user_id == res.locals.user.id) {
                            if (answer.question_id == req.params.qid) {
                                singleUpload(req, res, (err) => {
                                    if (err) {

                                        res.status(400).send({
                                            message: "Bad Request"
                                        });
                                    } else {
                                        let image = {
                                            'id': uuid.v4(),
                                            'url': req.file.location
                                        };

                                        getMetaDataFromS3(function (metadata) {
                                            if (metadata != null) {

                                                File.findOne({ where: { question_id: req.params.qid } })
                                                    .then(file => {
                                                        if (file) {
                                                            if (file.answer_id == answer.answer_id && file.file_name == req.file.originalname) {
                                                                deleteFromS3(req.file.key, function (res1) {
                                                                    if (res1 != null) {
                                                                        return res.status(400).json({ msg: 'Bad Request' });
                                                                    }
                                                                });

                                                            } else {
                                                                File.create({
                                                                    file_id: uuid.v4(),
                                                                    file_name: req.file.originalname,
                                                                    s3_object_name: req.file.key,
                                                                    created_date: moment().format(),
                                                                    question_id: answer.question_id,
                                                                    metadata: req.file
                                                                })

                                                                    .then(image => {

                                                                        return res.status(201).send({ image });
                                                                    })
                                                                    .catch(err => {
                                                                        deleteFromS3(req.file.key, function (res1) {
                                                                            if (res1 != null) {
                                                                                return res.status(400).json({ msg: 'Bad Request' });
                                                                            }
                                                                        });
                                                                    })
                                                            }
                                                        } else {
                                                            File.create({
                                                                file_id: uuid.v4(),
                                                                file_name: req.file.originalname,
                                                                s3_object_name: req.file.key,
                                                                created_date: moment().format(),
                                                                question_id: answer.question_id,
                                                                metadata: req.file,
                                                                answer_id: answer.answer_id
                                                            })

                                                                .then(image => {

                                                                    return res.status(201).send({ image });
                                                                })
                                                                .catch(err => {
                                                                    deleteFromS3(req.file.key, function (res1) {
                                                                        if (res1 != null) {
                                                                            return res.status(400).json({ msg: 'Bad Request' });
                                                                        }
                                                                    });
                                                                })
                                                        }
                                                    })


                                            }
                                        });
                                    }
                                })
                            } else {

                                return res.status(400).json({ msg: 'Bad Request' });
                            }
                        } else {
                            res.status(401).json({ msg: 'Unauthorized' });
                        }
                    })
            }
            else {

                return res.status(400).json({ msg: 'Bad Request' });
            }

        } else {
            res.status(401).json({ msg: 'Unauthorized' });
        }
    });
    app.use('/v1/question', router);

};
