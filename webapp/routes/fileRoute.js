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

    // Attach file to question
    router.post("/:qid/file", userAuth.basicAuth, (req, res) => {
        sdc.increment('POST File Triggered');
        let timer = new Date();
        if (res.locals.user) {
            let question_id = req.params.qid;
            if (question_id) {
                let dbtimer = new Date();
                Question.findByPk(question_id)
                    .then(question => {
                        if (question && question.user_id == res.locals.user.id) {
                            let dbtimer1 = new Date();
                            File.findOne({ where: { question_id: question_id } })
                                .then(file => {
                                    let s3timer = new Date();
                                    singleUpload(req, res, (err) => {
                                        if (err) {
                                            logger.error('error uploading file to s3: ' + err);
                                            res.status(400).send({
                                                message: "Error uploading file to S3"
                                            });
                                        } else {
                                            logger.info('Image uploaded to S3 successfully');
                                            let image = {
                                                'id': uuid.v4(),
                                                'url': req.file.location
                                            };
                                            let s3gettimer = new Date();
                                            getMetaDataFromS3(function (metadata) {
                                                if (metadata != null) {
                                                    let filetimer = new Date();
                                                    File.create({
                                                        file_id: uuid.v4(),
                                                        file_name: req.file.originalname,
                                                        s3_object_name: req.file.key,
                                                        created_date: moment().format(),
                                                        question_id: question_id,
                                                        metadata: req.file
                                                    })
                                                    .then(image => {
                                                            logger.info('Image added to File database table');
                                                            question.addFile(image);
                                                            return res.status(201).send({ image });
                                                        })
                                                        .catch(err => {
                                                            logger.error(err);
                                                            deleteFromS3(req.file.key, function (res1) {
                                                                if (res1 != null) {
                                                                    logger.info('Image deleted from s3');
                                                                }
                                                            });
                                                            return res.status(400).json({ msg: 'Bad Request' });
                                                        })
                                                    sdc.timing('post.filedb.timer', filetimer);
                                                }else{
                                                    logger.warn('Metadata not found');
                                                }
                                            });
                                            sdc.timing('s3.get.timer', s3gettimer);
                                        }
                                    })
                                    sdc.timing('s3.upload.timer', s3timer);
                                })
                                .catch(err => {
                                    logger.error(err);
                                    res.status(400).send({
                                        message: "Bad Request"
                                    });
                                })
                            sdc.timing('get.filedb.timer', dbtimer1);

                        } else {
                            logger.warn('Unauthorized');
                            res.status(401).json({ msg: 'Unauthorized' });
                        }
                    })
                sdc.timing('get.questiondb.timer', dbtimer);
            }
            else {
                return res.status(400).json({ msg: 'Bad Request' });
            }

        } else {
            logger.warn('Unauthorized');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('post.file.timer', timer);
    });

    // Delete file
    router.delete("/:qid/file/:fid", userAuth.basicAuth, (req, res) => {
        sdc.increment('DELETE File Triggered');
        let timer = new Date();
        if (res.locals.user) {
            let quetimer = new Date();
            Question.findByPk(req.params.qid)
                .then(question => {
                    if (question && question.user_id == res.locals.user.id) {
                        let filetimer = new Date();
                        File.findByPk(req.params.fid)
                            .then(file => {
                                if (file) {
                                    if (file.question_id == req.params.qid) {
                                        let imageId = file.s3_object_name;
                                        let s3timer = new Date();
                                        deleteFromS3(imageId, function (res1) {
                                            if (res1 != null) {
                                                logger.info('Image deleted from s3');
                                                let filetimer1 = new Date();
                                                File.destroy({ where: { file_id: req.params.fid } })
                                                    .then(file => {
                                                        logger.info('Image delete fron File database table');
                                                        return res.status(201).json({ msg: "No Content" });
                                                    }).catch(err => {
                                                        logger.error(err);
                                                        return res.status(400).json({ msg: err });
                                                    })
                                                sdc.timing('delete.filedb.timer', filetimer1);
                                            }else{
                                                logger.warn('Cannot delete file');
                                            }
                                        });
                                        sdc.timing('s3.delete.timer', s3timer);
                                    } else {
                                        logger.error('Question id does not exist');
                                        return res.status(404).json({ msg: 'Not Found' });
                                    }
                                } else {
                                    logger.error('Image not found');
                                    return res.status(404).json({ msg: 'Image Not Found!' });
                                }

                            })
                            .catch(err=>{
                                logger.error(err);
                                res.status(400).send({
                                    message: "Bad Request"
                                });
                            })
                        sdc.timing('get.filedb.timer', filetimer);

                    } else {
                        logger.warn('Unauthorized');
                        return res.status(401).json({ msg: 'Unauthorized' })
                    }
                }).catch(err => {
                    logger.error(err);
                    return res.status(400).json({ msg: 'Bad Request' })
                })
            sdc.timing('get.questiondb.timer', quetimer);

        } else {
            logger.warn('Unauthorized');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('delete.file.timer', timer);
    });

    //Delete file attached to answer
    router.delete("/:qid/answer/:aid/file/:fid", userAuth.basicAuth, (req, res) => {
        sdc.increment('DELETE File Triggered');
        let timer = new Date();
        if (res.locals.user) {
            let answertimer = new Date();
            Answer.findByPk(req.params.aid)
                .then(answer => {
                    if (answer && answer.user_id == res.locals.user.id) {
                        let filetimer = new Date();
                        File.findByPk(req.params.fid)
                            .then(file => {
                                if (file) {
                                    if (file.question_id == req.params.qid &&
                                        file.answer_id == req.params.aid) {
                                        let imageId = file.s3_object_name;
                                        let s3timer = new Date();
                                        deleteFromS3(imageId, function (res1) {
                                            if (res1 != null) {
                                                logger.info('Image deleted from s3');
                                                File.destroy({ where: { file_id: req.params.fid } })
                                                    .then(file => {
                                                        logger.info('Image deleted from File Database');
                                                        return res.status(201).json({ msg: "No Content" });
                                                    }).catch(err => {
                                                        logger.error(err);
                                                        return res.status(400).json({ msg: err });
                                                    })
                                            }
                                        });
                                        sdc.timing('s3.delete.timer', s3timer);
                                    } else {
                                        logger.error('Question ID/ Answer Id not found');
                                        return res.status(404).json({ msg: 'Not Found' });
                                    }
                                } else {
                                    logger.warn('Image not found');
                                    return res.status(404).json({ msg: 'Image Not Found!' });
                                }
                            }).catch(err => {
                                logger.error(err);
                                return res.status(400).json({ msg: 'Bad Request' })
                            })
                        sdc.timing('get.filedb.timer', filetimer);
                    } else {
                        logger.warn('Unauthorized');
                        return res.status(401).json({ msg: 'Unauthorized' })
                    }
                }).catch(err => {
                    logger.error('Answer ID not found: ' + err);
                    return res.status(400).json({ msg: 'Bad Request' })
                })
            sdc.timing('get.answerdb.timer', answertimer);

        } else {
            logger.warn('Unauthorized');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('delete.filedb.timer', timer);
    });

    // Post a file to answer
    router.post("/:qid/answer/:aid/file", userAuth.basicAuth, (req, res) => {
        sdc.increment('POST File Triggered');
        let timer = new Date();
        if (res.locals.user) {
            let answer_id = req.params.aid;

            if (answer_id) {
                let answertimer = new Date();
                Answer.findByPk(answer_id)
                    .then(answer => {
                        if (answer && answer.user_id == res.locals.user.id) {
                            if (answer.question_id == req.params.qid) {
                                let s3timer = new Date();
                                singleUpload(req, res, (err) => {
                                    if (err) {
                                        logger.error('Error uploading file to S3: ' + err);
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

                                                let filetimer = new Date();
                                                File.create({
                                                    file_id: uuid.v4(),
                                                    file_name: req.file.originalname,
                                                    s3_object_name: req.file.key,
                                                    created_date: moment().format(),
                                                    question_id: req.params.qid,
                                                    metadata: req.file,
                                                    answer_id: answer.answer_id
                                                })
                                                    .then(image => {
                                                        logger.info('Image uploaded to S3 and added to File database table');
                                                        answer.addFile(image);
                                                        return res.status(201).send({ image });
                                                    })
                                                    .catch(err => {
                                                        logger.error(err);
                                                        deleteFromS3(req.file.key, function (res1) {
                                                            if (res1 != null) {
                                                                logger.info('Image deleted from s3');
                                                            }
                                                        });
                                                        return res.status(400).json({ msg: 'Bad Request' });
                                                    })
                                                sdc.timing('post.file.timer', filetimer);

                                            }
                                        });
                                    }
                                })
                                sdc.timing('s3.upload.timer', s3timer);
                            } else {
                                logger.error('Answer ID does not belog to given Question ID');
                                return res.status(400).json({ msg: 'Bad Request' });
                            }
                        } else {
                            logger.warn('Unauthorized');
                            res.status(401).json({ msg: 'Unauthorized' });
                        }
                    })
                    .catch(err=>{
                        logger.error(err);
                        res.status(400).send({
                            message: "Bad Request"
                        });
                    })
                sdc.timing('get.answer.timer', answertimer);
            }
            else {
                return res.status(400).json({ msg: 'Bad Request' });
            }

        } else {
            logger.warn('Unauthorized');
            res.status(401).json({ msg: 'Unauthorized' });
        }
        sdc.timing('post.file.timer', timer);
    });
    app.use('/v1/question', router);

};
