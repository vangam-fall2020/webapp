const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  HOST: process.env.DB_RDS_HOST,
  USER: process.env.DB_RDS_USERNAME,
  PASSWORD: process.env.DB_RDS_PASSWORD,
  DB: process.env.DB_RDS_DATABASE,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 30000
  },
  IMAGE_BUCKET: process.env.DB_RDS_S3Bucket,
  DB_RDS_PORT: process.env.DB_RDS_PORT
};