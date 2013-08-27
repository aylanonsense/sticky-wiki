var express = require('express.io');
//var fs = require('fs');
var lessMiddleware = require('less-middleware');
//var MongoStore = require('connect-mongo')(express);
//var mongoose = require('mongoose');
var config = require('./config/config');
var router = require('./router');
//var auth = require('./authrouter');
//var models = require('./models');
var StickyServer = require('./server');
var app;
var stickyServer;

app = express();
app.http().io();

//mongoose.connect(config.db.uri);

stickyServer = new StickyServer();

app.use(lessMiddleware({ src: __dirname + "/public", compress : true }));
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser());
/*app.use(express.session({
	store: new MongoStore({ url: config.db.uri }),
	secret: config.session.secret
}));*/

app.io.route('join_sticky_board', function(req) {
	stickyServer.addConnection(req);
});
app.get('/', router.renderIndex);
/*app.get('/main', function(req, res) {
	res.send("You are logged in as " + (req.session.user_id || " no one") + "!");
});
app.get('/logout', function(req, res) {
	delete req.session.user_id;
	res.redirect('main');
});
app.get('/register', auth.showRegisterForm);
app.post('/register', auth.register);
app.get('/admin', auth.showAdminConsole);
app.get('/login', auth.showLoginForm);
app.post('/login', auth.login);*/

app.listen(config.server.port);
//stickyServer.start();

exports.app = app;