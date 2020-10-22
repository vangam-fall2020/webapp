module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "Fall2020Csye@6225",
  DB: "webapp",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 30000
  }
};