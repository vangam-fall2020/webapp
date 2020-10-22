module.exports = {
  "db": {
    "host": process.env.DB_RDS_HOST,
    "user": process.env.DB_RDS_USERNAME,
    "password": process.env.DB_RDS_PASSWORD,
    "database": "csye6225"
  },
  "image": {
    "imageBucket": process.env.DB_RDS_S3Bucket
  }
};