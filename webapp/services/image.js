const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const Config = require('../config/config');

//global common variables
var imageDir = Config.image.imageBucket;

var metadata = new aws.MetadataService();
function getEC2Credentials(rolename) {
    var promise = new Promise((resolve, reject) => {
        metadata.request('/latest/meta-data/iam/security-credentials/' + rolename, function (err, data) {
            if (err) {
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
    console.log("\n----- credentials ------", credentials);
    aws.config.accessKeyId = credentials.AccessKeyId;
    aws.config.secretAccessKey = credentials.SecretAccessKey;
    aws.config.sessionToken = credentials.Token;
}).catch((err) => {
    console.log("err: ", err);
    console.log("\n-----errrrr------", err);
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
                cb("Error:image upload only supports the following imagetypes - " + imagetypes);

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
            console.log("err : ", err);
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
            console.log("err 4: ", err);
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