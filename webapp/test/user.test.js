// Setting env variable to test
process.env.NODE_ENV = "test"

const base = 'http://localhost:8080';
const request = require('request');
const sinon = require('sinon');
let userService = require('./sequelize_mock');
const { requests } = require('sinon');


// ------------------ GET --------------------
describe('when stubbed', () => {
    beforeEach(() => {
        this.get = sinon.stub(request, 'get');
    });
    afterEach(() => {
        request.get.restore();
    });
    describe('GET /v1/users/self', () => {
        it('GET request - returning all users - 200', (done) => {
            userService.GetUsers().then((data) => {
                this.get.yields(null, data.all.success.res, JSON.stringify(data.all.success.body));
                done();
            });
            request.get(`${base}/v1/user/self`, (err, res, body) => {
                res.statusCode.should.eql(200);
                res.headers['content-type'].should.contain('application/json');
                body = JSON.parse(body);
                body.status.should.eql('success');
                body.data[0].username.should.eql('jane1.doe@example.com');
                done();
            });
        });

        it('User unauthorized test - 401', (done) => {
            userService.GetUsers().then((data) => {
                const auth = {
                    username: "janenew9.doe@example.com",
                    password: "Csyenetworks@6225"
                }
                if (data.all.success.body.data[0].password != auth.password
                    && data.all.success.body.data[0].username != auth.username) {
                    const obj = {
                        body: {
                            res: {
                                statusCode: 401,
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
                res.statusCode.should.equal(401);
                res.headers['content-type'].should.contain('application/json');
                body = JSON.parse(body);
                body.status.should.eql('error');
                body.message.should.eql('Unauthorized');
                done();
            });
        });


    });
});

// -------------------- POST -------------------------
describe('when stubbed', () => {
    beforeEach(() => {
        this.get = sinon.stub(request, 'get');
        this.post = sinon.stub(request, 'post');
    });
    afterEach(() => {
        request.get.restore();
        request.post.restore();
    });
    describe('POST /v1/user', () => {
        it('Invalid User input - 400 Bad Request', (done) => {
            const options = {
                body: {
                    first_name: " Jane8",
                    last_name: "Doe8",
                    password: "Csyenetworks8@6225"
                },
                json: true,
                url: `${base}/v1/user`
            };
            userService.PostRequest().then((data) => {
                const obj = data.add.failure;
                this.post.yields(null, obj.res, JSON.stringify(obj.body));
                done();
            });
            request.post(`${base}/v1/user`, (err, res, body) => {
                res.statusCode.should.eql(400);
                res.headers['content-type'].should.contain('application/json');
                body = JSON.parse(body);
                body.status.should.eql('error');
                body.message.should.eql('Bad Request');
                done();
            });
        });
    });
});

// ------------------------- PUT -----------------------------

describe('when stubbed', () => {
    beforeEach(() => {
        this.get = sinon.stub(request, 'get');
        this.post = sinon.stub(request, 'post');
        this.put = sinon.stub(request, 'put');
    });
    afterEach(() => {
        request.get.restore();
        request.post.restore();
        request.put.restore();
    });
    describe('PUT /v1/users/self', () => {
        it('Invalid User details update - 400', (done) => {
            const options = {
                first_name: " Jane1 update",
                last_name: "Doe1",
                password: "Csyenetworks@6225",
                username: "jane8.doe@example.com",
            };

            userService.PutRequest().then((data) => {
                for (user in data.all.success.body) {
                    if (user.username != options.username) {
                        const obj = data.all.failure;
                        this.get.yields(null, obj.res, JSON.stringify(obj.body));
                        break;
                    }
                }
                done();
            });
            request.put(`${base}/v1/user/self`, (err, res, body) => {
                res.statusCode.should.eql(400);
                res.headers['content-type'].should.contain('application/json');
                body = JSON.parse(body);
                body.status.should.eql('error');
                body.message.should.eql('Bad Request');
                done();
            });
        });
    });
});