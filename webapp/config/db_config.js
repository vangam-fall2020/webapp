module.exports = {
  HOST: process.env.DB_RDS_HOST,
  USER: process.env.DB_RDS_USERNAME,
  PASSWORD: process.env.DB_RDS_PASSWORD,
  DB: "csye6225",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 30000
  }
};