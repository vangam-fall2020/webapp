// Import the mock library
var SequelizeMock = require('sequelize-mock');

// Setup the mock database connection
var DBConnectionMock = new SequelizeMock();



// Define our Model
var UserMock = DBConnectionMock.define('users', {
    "id": "46cf72e1-56b0-4399-b82b-561dd2efede2",
    "first_name": " Jane new 8",
    "last_name": "Doe1 new 8",
    "password": "Csyenetworks@6225",
    "email_address": "janenew8.doe@example.com",
    "account_created": "2020-09-30T15:26:57.000Z",
    "account_updated": "2020-09-30T15:26:57.000Z"
});


async function GetUsers() {

    let promise =  new Promise(function (resolve, reject) {

        UserMock.findOne({
            where: {
                username: 'Jane new 8',
                password: "Csyenetworks@6225"
            },
        }).then(function (user) {
            return  resolve({
                "all": {
                  "success": {
                    "res": {
                      "statusCode": 200,
                      "headers": {
                        "content-type": "application/json"
                      }
                    },
                    "body": {
                      "status": "success",
                      "data": [
                        {
                            "id":  user.get('id'),
                            "first_name":user.get('first_name'),
                            "last_name": user.get('last_name'),
                            "password": user.get('password'),
                            "email_address": user.get('email_address'),
                            "account_created": user.get('account_created'),
                            "account_updated": user.get('account_updated')
                        }
                      ]
                    }
                  },
                  "failure": {
                    "res": {
                      "statusCode": 400,
                      "headers": {
                        "content-type": "application/json"
                      }
                    },
                    "body": {
                      "status": "error",
                      "message": "Bad Request"
                    }
                  }
                }
              });
            });
    });
    let res = await promise;
    return res;
}

module.exports.GetUsers = GetUsers;
module.exports.UserMock = UserMock;
