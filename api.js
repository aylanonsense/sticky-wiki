var models = require('./models');
var Sticky = models.Sticky;

function addRoutes(app) {
	app.get('/api/stickies', function(req, res) {
		getAllStickies(function(stickies) {
			res.send(stickies);
		});
	});
	app.get('/api/sticky/:id', function(req, res) {
		getSticky(req.params.id, function(sticky) {
			res.send(sticky);
		});
	});
	app.delete('/api/sticky/:id', function(req, res) {
		deleteSticky(req.params.id, function(sticky) {
			res.send(sticky);
		});
	});
}
function getSticky(id, callback) {
	Sticky.find({ _id: id }, function(err, stickyRecord) {
		if(err || !stickyRecord) {
			callback(null);
		}
		else {
			stickyRecord = stickyRecord[0];
			callback({
				id: stickyRecord.id,
				text: stickyRecord.text,
				x: stickyRecord.x,
				y: stickyRecord.y,
				textColor: stickyRecord.textColor,
				paperColor: stickyRecord.paperColor,
				pinColor: stickyRecord.pinColor,
				rotation: stickyRecord.rotation
			});
		}
	});
}
function getAllStickies(callback) {
	Sticky.find(function(err, stickyRecords) {
		if(err) {
			callback([]);
		}
		else {
			var stickies = [];
			stickyRecords.sort(function(a, b) { //TODO sort using mongoose instead
				return a.lastModified.getTime() - b.lastModified.getTime();
			});
			stickyRecords.forEach(function(stickyRecord) {
				stickies.push({
					id: stickyRecord.id,
					text: stickyRecord.text,
					x: stickyRecord.x,
					y: stickyRecord.y,
					textColor: stickyRecord.textColor,
					paperColor: stickyRecord.paperColor,
					pinColor: stickyRecord.pinColor,
					rotation: stickyRecord.rotation
				});
			});
			callback(stickies);
		}
	});
}
function deleteSticky(id, callback) {
	Sticky.find({ _id: id }, function(err, stickyRecord) {
		if(err || !stickyRecord) {
			callback(false);
		}
		else {
			stickyRecord = stickyRecord[0];
			stickyRecord.remove();
			callback({
				id: stickyRecord.id,
				text: stickyRecord.text,
				x: stickyRecord.x,
				y: stickyRecord.y,
				textColor: stickyRecord.textColor,
				paperColor: stickyRecord.paperColor,
				pinColor: stickyRecord.pinColor,
				rotation: stickyRecord.rotation
			});
		}
	});
}

exports.addRoutes = addRoutes;
exports.getSticky = getSticky;
exports.getAllStickies = getAllStickies;
exports.deleteSticky = deleteSticky;