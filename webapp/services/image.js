const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const Config = require('../config/config');

const log4js = require('log4js');
	log4js.configure({
	  appenders: { logs: { type: 'file', filename: '/home/ubuntu/webapp/logs/webapp.log' } },
	  categories: { default: { appenders: ['logs'], level: 'info' } }
    });
const logger = log4js.getLogger('logs');

//global common variables
var imageDir = Config.IMAGE_BUCKET;

var metadata = new aws.MetadataService();
function getEC2Credentials(rolename) {
    var promise = new Promise((resolve, reject) => {
        metadata.request('/latest/meta-data/iam/security-credentials/' + rolename, function (err, data) {
            if (err) {
                logger.fatal(err);
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });

    return promise;
};

const s3 = new aws.S3();
getEC2Credentials('EC2-CSYE6225').then((credentials) => {
    logger.info('Successfully retrieved AWS credentials');
    console.log("credentials:  ", credentials);
    aws.config.accessKeyId = credentials.AccessKeyId;
    aws.config.secretAccessKey = credentials.SecretAccessKey;
    aws.config.sessionToken = credentials.Token;
}).catch((err) => {
    logger.fatal(err);
    console.log("err: ", err);
});

let objId;
let upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: imageDir,
        key: function (req, image, cb) {
            let imagetypes = /png|jpg|jpeg/;
            let mimetype = imagetypes.test(image.mimetype);
            if (mimetype) {
                let imageName = image.originalname.replace(/\s/g, '');
                objId = imageName + '_' + Date.now().toString();
                cb(null, objId);
            } else {
                logger.error('Upload Image of type - '+ imagetypes);
                cb("Image upload only supports the following imagetypes - " + imagetypes);
            }
        }
    })
});

function deleteFromS3(imageId, cb) {
    var params = {
        Bucket: imageDir,
        Key: imageId
    };
    s3.deleteObject(params, function (err, data) {
        if (data) {
            cb(data);
        }
        else {
            logger.fatal(err);
            cb(null);
        }
    });
}

function getMetaDataFromS3(cb) {
    var params = {
        Bucket: imageDir,
        Key: objId
    };
    s3.headObject(params, function (err, data) {
        if (err) {
            logger.fatal(err);
            cb(null);
        }
        else {
            cb(data);
        }
    });
}

module.exports = {
    upload,
    deleteFromS3,
    getMetaDataFromS3
}