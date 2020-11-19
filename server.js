const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const log4js = require('log4js');
log4js.configure({
  appenders: { logs: { type: 'file', filename: '/home/ubuntu/webapp/logs/webapp.log' } },
  categories: { default: { appenders: ['logs'], level: 'info' } }
});
const logger = log4js.getLogger('logs');
const aws = require('aws-sdk');

var corsOptions = {
  origin: "http://localhost:8081"
};

const db = require("./webapp/models");
db.sequelize.sync();

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Nodejs(Webapp) application." });
});

require("./webapp/routes/userRoute.js")(app);
require("./webapp/routes/questionRoute.js")(app);
require("./webapp/routes/answerRoute.js")(app);
require("./webapp/routes/fileRoute.js")(app);


// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.trace("Application started");
 
  var metadata = new aws.MetadataService();
  meta.request("/latest/meta-data/instance-id", function(err, data){
    if (err) {
      logger.fatal(err);
    } else {
      logger.info("Application started at "+ JSON.parse(data).instance-id);
    }
  });
  logger.info(`Server is running on port ${PORT}.`);
  console.log(`Server is running on port ${PORT}.`);
});

module.exports = app;