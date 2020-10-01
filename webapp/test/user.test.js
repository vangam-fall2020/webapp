// Setting env variable to test
process.env.NODE_ENV = "test"

var should = require('should');
const base = 'http://localhost:8080';
const request = require('request');
const sinon = require('sinon');
let userService = require('./sequelize_mock');
const { requests } = require('sinon');

describe('when stubbed', () => {
    beforeEach(() => {
        this.get = sinon.stub(request, 'get');
    });

    afterEach(() => {
        request.get.restore();
    });
    describe('GET /v1/users', () => {


        it('should return all users', (done) => {
            userService.GetUsers().then((data) => {
                this.get.yields(null, data.all.success.res, JSON.stringify(data.all.success.body));
                done();
            });
            request.get(`${base}/v1/user/self`, (err, res, body) => {
                res.status.should.eql(400);
                res.statusCode.should.eql(200);
                res.headers['content-type'].should.contain('application/json');
                body = JSON.parse(body);
                body.status.should.eql('success');
                body.data[0].email_address.should.eql('janenew8.doe@example.com');
                done();
            });
        });

        it('User unauthorized test - 401', (done) => {
            userService.GetUsers().then((data) => {
                const auth = {
                    username: "janenew9.doe@example.com",
                    password: "Csyenetworks@6225"
                }

                if (data.all.success.body.data[3] != auth.password && data.all.success.body.data[4] != auth.username) {
                    const obj = {
                        body: {
                            res: {
                                statusCode: 404,
                                headers: {
                                    "content-type": "application/json"
                                }
                            },
                            body: {
                                status: "error",
                                message: "Unauthorized"
                            }

                        },
                        url: `${base}/v1/user/self/`
                    };
                    this.get.yields(null, obj.body.res, JSON.stringify(obj.body.body));
                }

                done();
            });

            request.get(`${base}/v1/user/self`, (err, res, body) => {
                res.statusCode.should.equal(400);
                res.headers['content-type'].should.contain('application/json');
                body = JSON.parse(body);
                body.status.should.eql('error');
                body.message.should.eql('Unauthorized');
                done();
            });
        });


    });
});