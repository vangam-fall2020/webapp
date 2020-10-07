// Import the mock library
var SequelizeMock = require('sequelize-mock');

// Setup the mock database connection
var DBConnectionMock = new SequelizeMock();


// Define our Model
var UserMock = DBConnectionMock.define('users', [{
    "id": "0194ca6a-8882-4c7e-b5d7-cadd01de5987",
    "first_name": " Jane1",
    "last_name": "Doe1",
    "password": "Csyenetworks1@6225",
    "username": "jane1.doe@example.com",
    "account_created": "2020-10-01T07:06:56.000Z",
    "account_updated": "2020-10-01T07:09:13.000Z"
}, {
    "id": "'b956a3fc-663c-4856-b0f7-f416d00715a9",
    "first_name": " Jane2",
    "last_name": "Doe2",
    "password": "Csyenetworks2@6225",
    "username": "jane2.doe@example.com",
    "account_created": "2020-10-01T07:06:56.000Z",
    "account_updated": "2020-10-01T07:09:13.000Z"
}]);


async function GetUsers() {
    let promise = new Promise(function (resolve, reject) {

        UserMock.findOne({
            where: {
                username: 'jane1.doe@example.com',
            },
        }).then(function (user) {
            return resolve({
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
                                    "id": user.get('id'),
                                    "first_name": user.get('first_name'),
                                    "last_name": user.get('last_name'),
                                    "password": user.get('password'),
                                    "username": user.get('username'),
                                    "account_created": user.get('account_created'),
                                    "account_updated": user.get('account_updated')
                                }
                            ]
                        }
                    },
                    "failure": {
                        "res": {
                            "statusCode": 401,
                            "headers": {
                                "content-type": "application/json"
                            }
                        },
                        "body": {
                            "status": "error",
                            "message": "Unauthorized"
                        }
                    }
                }
            });
        });
    });
    let res = await promise;
    return res;
}

async function PostRequest() {

    let promise = new Promise(function (resolve, reject) {

        UserMock.findOne({
            where: {
                username: 'jane1.doe@example.com',
            },
        }).then(function (user) {
            return resolve({
                "add": {
                    "success": {
                        "res": {
                            "statusCode": 201,
                            "headers": {
                                "content-type": "application/json"
                            }
                        },
                        "body": {
                            "status": "success",
                            "data": [
                                {
                                    "id": "0194ca6a-8882-4c7e-b5d7-cadd01de5987",
                                    "first_name": " Jane1",
                                    "last_name": "Doe1",
                                    "password": "Csyenetworks@6225",
                                    "username": "jane1.doe@example.com",
                                    "account_created": "2020-10-01T07:06:56.000Z",
                                    "account_updated": "2020-10-01T07:09:13.000Z"
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

async function PutRequest() {
    let promise = new Promise(function (resolve, reject) {
        UserMock.findAll({
            raw: true
        }).then(function (users) {
            return resolve({
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
                            "data": [{
                                "id": "0194ca6a-8882-4c7e-b5d7-cadd01de5987",
                                "first_name": " Jane1",
                                "last_name": "Doe1",
                                "password": "Csyenetworks1@6225",
                                "username": "jane1.doe@example.com",
                                "account_created": "2020-10-01T07:06:56.000Z",
                                "account_updated": "2020-10-01T07:09:13.000Z"
                            }, {
                                "id": "'b956a3fc-663c-4856-b0f7-f416d00715a9",
                                "first_name": " Jane2",
                                "last_name": "Doe2",
                                "password": "Csyenetworks2@6225",
                                "username": "jane2.doe@example.com",
                                "account_created": "2020-10-01T07:06:56.000Z",
                                "account_updated": "2020-10-01T07:09:13.000Z"
                            }]
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
module.exports.PostRequest = PostRequest;
module.exports.PutRequest = PutRequest;
module.exports.UserMock = UserMock;
