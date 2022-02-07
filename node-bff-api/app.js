const express = require('express')
var cors = require('cors')
const app = express()
const port = 3000

var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');


app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

var RateLimit = require('express-rate-limit');

var limiter = new RateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
	delayMs: 0,
	message: "Too many accounts created from this IP, please try again after an hour"
});

app.use(limiter);

const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
	audience: 'http://localhost:4200',
	issuerBaseURL: 'https://dev-aivd9uma.us.auth0.com',
});

app.use(function (err, req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, authorization');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

function errorHandler(err, req, res, next) {

	if (err.statusCode === 401) {
		res
			.status(401)
			.send({ message: 'Unauthorized Token Invalid' });
	}

	next();
}

const fs = require('fs');

var https = require('https');

var privateKey = fs.readFileSync('./sslcert/key.pem', 'utf8');
var certificate = fs.readFileSync('./sslcert/cert.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };

const checkScopes = requiredScopes('openid');

var request = require('request');

var host = process.env.DOCKER_HOST_IP || 'http://localhost'

app.get('/products', checkJwt, errorHandler, checkScopes, async (req, res, next) => {
	const headerAuthorization = req.headers.authorization;

	request({
		url: `${host}:3001/products`, 
		headers: { 'Authorization': headerAuthorization }
	}, function (err, body) {
		return res.json(JSON.parse(body.body));
	});
});

app.post('/buy', checkJwt, errorHandler, checkScopes, async (req, res, next) => {
	const headerAuthorization = req.headers.authorization;

	request({
		url: `${host}:3002/orders`,
		headers: { 'content-type': 'application/json', 'Authorization': headerAuthorization },
		method: 'POST',
		body: JSON.stringify(req.body)
	}, function (error, response, body) {
		if (error) {
			res
				.status(500)
				.send({ message: 'Internal server error' });
		} else {
			var resp = JSON.parse(body);
			resp.status = response.statusCode;
			return res.json(resp);
		}
	});
});

app.get('/ordersByClientId/:id', checkJwt, errorHandler, checkScopes, async (req, res, next) => {
	const headerAuthorization = req.headers.authorization;
	var id = req.params.id;

	request({
		url: `${host}:3001/ordersByClientId?id=${id}`,
		headers: { 'Authorization': headerAuthorization },
		method: 'GET',
	}, function (error, response, body) {
		if (error) {
			res
				.status(500)
				.send({ message: 'Internal server error' });
		} else {
			var resp = JSON.parse(body);
			resp.status = response.statusCode;
			return res.json(resp);
		}
	});
});

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
	console.log(`Listening at http://localhost:${port}`)
});
