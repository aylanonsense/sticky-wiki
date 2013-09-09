var models = require('./models');
var Sticky = models.Sticky;
var Sticker = models.Sticker;
var StickyMove = models.StickyMove;

function addRoutes(app) {
	app.get('/api/stickies', function(req, res) {
		getAllStickies(function(stickies) {
			res.send(stickies);
		});
	});
	app.get('/api/stickers', function(req, res) {
		getAllStickers(function(stickers) {
			res.send(stickers);
		});
	});
	app.get('/api/moves', function(req, res) {
		getAllStickyMoves(function(moves) {
			res.send(moves);
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
	app.delete('/api/sticker/:id', function(req, res) {
		deleteSticker(req.params.id, function(sticker) {
			res.send(sticker);
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
		if(err || !stickyRecord || stickyRecord.length === 0) {
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
function getAllStickers(callback) {
	Sticker.find(function(err, stickerRecords) {
		if(err) {
			callback([]);
		}
		else {
			var stickers = [];
			stickerRecords.sort(function(a, b) { //TODO sort using mongoose instead
				return a.lastModified.getTime() - b.lastModified.getTime();
			});
			stickerRecords.forEach(function(stickerRecord) {
				stickers.push({
					id: stickerRecord.id,
					stickyId: stickerRecord.stickyId,
					type: stickerRecord.type,
					x: stickerRecord.x,
					y: stickerRecord.y,
					rotation: stickerRecord.rotation
				});
			});
			callback(stickers);
		}
	});
}
function deleteSticker(id, callback) {
	Sticker.find({ _id: id }, function(err, stickerRecord) {
		if(err || !stickerRecord || stickerRecord.length === 0) {
			callback(false);
		}
		else {
			stickerRecord = stickerRecord[0];
			stickerRecord.remove();
			callback({
				id: stickerRecord.id,
				stickyId: stickerRecord.stickyId,
				type: stickerRecord.type,
				x: stickerRecord.x,
				y: stickerRecord.y,
				rotation: stickerRecord.rotation
			});
		}
	});
}
function getAllStickyMoves(callback) {
	StickyMove.find(function(err, stickyMoveRecords) {
		if(err) {
			callback([]);
		}
		else {
			var stickyMoves = [];
			stickyMoveRecords.sort(function(a, b) { //TODO sort using mongoose instead
				return a.dateMoved.getTime() - b.dateMoved.getTime();
			});
			stickyMoveRecords.forEach(function(stickyMoveRecord) {
				stickyMoves.push({
					stickyId: stickyMoveRecord.stickyId,
					from: { x: stickyMoveRecord.from.x, y: stickyMoveRecord.from.y },
					to: { x: stickyMoveRecord.to.x, y: stickyMoveRecord.to.y }
				});
			});
			callback(stickyMoves);
		}
	});
}

exports.addRoutes = addRoutes;
exports.getSticky = getSticky;
exports.getAllStickies = getAllStickies;
exports.deleteSticky = deleteSticky;
exports.getAllStickers = getAllStickers;
exports.deleteSticker = deleteSticker;
exports.getAllStickyMoves = getAllStickyMoves;