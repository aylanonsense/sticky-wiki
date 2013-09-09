var api = require('./api');

function addRoutes(app) {
	app.get('/', function(req, res) {
		res.render('index.jade', {});
	});
	app.get('/admin', function(req, res) {
		api.getAllStickies(function(stickies) {
			api.getAllStickers(function(stickers) {
				res.render('admin.jade', {
					stickies: stickies,
					stickers: stickers
				});
			});
		});
	});
}

exports.addRoutes = addRoutes;