var models = require('./models');
var Sticky = models.Sticky;
var Sticker = models.Sticker;

function StickyServer() {
	this._room = 'sticky_board_' + (this.NEXT_ROOM_ID++);
	this._nextClientId = 1;
}
StickyServer.prototype.NEXT_ROOM_ID = 1;
StickyServer.prototype.addConnection = function(conn) {
	var self = this;
	var clientId = this._nextClientId++;
	conn.io.join(this._room);
	this._sendAllStickiesAndStickers(conn);
	conn.socket.on('create_sticky', function(data) {
		self._handleStickyCreateRequest(conn, clientId, data.seqNum, data.sticky);
	});
	conn.socket.on('create_sticker', function(data) {
		self._handleStickerCreateRequest(conn, clientId, data.stickyId, data.type, data.x, data.y);
	});
	conn.socket.on('move_sticky', function(data) {
		self._handleStickyMoveRequest(conn, clientId, data.stickyId, data.x, data.y);
	});
	conn.socket.on('disconnect', function() {
		console.log("Client " + clientId + " disconnected!");
	});
	console.log("Client " + clientId + " connected!");
};
StickyServer.prototype._sendAllStickiesAndStickers = function(conn) {
	var stickies = null;
	var stickers = null;
	Sticky.find(function(err, stickyRecords) {
		if(err) {
			console.log("Error retrieving all stickies:", err);
		}
		else {
			stickies = [];
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
			if(stickers !== null) {
				conn.io.emit('draw_all', {
					stickies: stickies,
					stickers: stickers
				});
			}
		}
	});
	Sticker.find(function(err, stickerRecords) {
		if(err) {
			console.log("Error retrieving all stickers:", err);
		}
		else {
			stickers = [];
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
			if(stickies !== null) {
				conn.io.emit('draw_all', {
					stickies: stickies,
					stickers: stickers
				});
			}
		}
	});
};
StickyServer.prototype._handleStickyCreateRequest = function(conn, clientId, seqNum, sticky) {
	if(typeof sticky !== "object" ||
		typeof sticky.text !== "string" ||
		typeof sticky.x !== "number" ||
		typeof sticky.y !== "number" ||
		typeof sticky.textColor !== "string" ||
		typeof sticky.paperColor !== "string" ||
		typeof sticky.pinColor !== "string") {
		return;
	}
	if(sticky.text.length > 140) {
		return;
	}
	if(sticky.textColor !== "black" && sticky.textColor !== "red" && sticky.textColor !== "blue") {
		return;
	}
	if(sticky.paperColor !== "yellow" && sticky.paperColor !== "pink" && sticky.paperColor !== "green" && sticky.paperColor !== "blue" && sticky.paperColor !== "orange") {
		return;
	}
	if(sticky.pinColor !== "red" && sticky.pinColor !== "green" && sticky.pinColor !== "yellow" && sticky.pinColor !== "blue") {
		return;
	}

	sticky = {
		text: sticky.text,
		x: sticky.x,
		y: sticky.y,
		textColor: sticky.textColor,
		paperColor: sticky.paperColor,
		pinColor: sticky.pinColor,
		rotation: Math.round(30 * Math.random() - 15)
	};

	//save the sticky to the db
	var stickyRecord = new Sticky({
		text: sticky.text,
		x: sticky.x,
		y: sticky.y,
		textColor: sticky.textColor,
		paperColor: sticky.paperColor,
		pinColor: sticky.pinColor,
		rotation: sticky.rotation,
		authorClientId: clientId,
		authorSessionId: (conn ? conn.sessionId : ''),
		authorAddress: (conn && conn.handshake && conn.handshake.address && conn.handshake.address.address ? conn.handshake.address.address : '')
	});
	stickyRecord.save(function(err) {
		if(err) {
			console.log('Sticky "' + sticky.text + '" could NOT be saved!');
		}
		else {
			console.log('Sticky "' + sticky.text + '" saved!');
		}
	});
	sticky.id = stickyRecord.id;

	//send sticky to all clients
	conn.io.emit('replace_sticky', { seqNum: seqNum, sticky: sticky });
	conn.io.room(this._room).broadcast('draw_sticky', sticky);
};
StickyServer.prototype._handleStickerCreateRequest = function(conn, clientId, stickyId, type, x, y) {
	if(typeof stickyId !== "string" ||
		typeof type !== "string" ||
		typeof x !== "number" ||
		typeof y !== "number") {
		return;
	}

	var sticker = {
		stickyId: stickyId,
		type: type,
		x: x,
		y: y,
		rotation: Math.round(30 * Math.random() - 15)
	};

	//save the sticker to the db
	var stickerRecord = new Sticker({
		stickyId: sticker.stickyId,
		type: sticker.type,
		x: sticker.x,
		y: sticker.y,
		rotation: sticker.rotation,
		authorClientId: clientId,
		authorSessionId: (conn ? conn.sessionId : ''),
		authorAddress: (conn && conn.handshake && conn.handshake.address && conn.handshake.address.address ? conn.handshake.address.address : '')
	});
	stickerRecord.save(function(err) {
		if(err) {
			console.log('Sticker "' + sticker.type + '" could NOT be saved!');
		}
		else {
			console.log('Sticker "' + sticker.type + '" saved!');
		}
	});
	sticker.id = stickerRecord.id;

	//send sticker to all clients
	conn.io.emit('draw_sticker', sticker );
	conn.io.room(this._room).broadcast('draw_sticker', sticker);
};
StickyServer.prototype._handleStickyMoveRequest = function(conn, clientId, stickyId, x, y) {
	if(typeof stickyId !== "string" ||
		typeof x !== "number" ||
		typeof y !== "number") {
		return;
	}

	var self = this;
	Sticky.findOne({ _id: stickyId }, function(err, stickyRecord) {
		if(err || !stickyRecord) {
			console.log("Could not find sticky with id of " + stickyId);
		}
		else {
			var oldX = stickyRecord.x;
			var oldY = stickyRecord.y;
			stickyRecord.x = x;
			stickyRecord.y = y;
			stickyRecord.lastModified = Date.now();
			stickyRecord.save(function(err) {
				if(err) {
					console.log('Could not move sticky "' + stickyRecord.text + '" to ' + x + ',' + y);
					conn.io.emit('move_sticky', { stickyId: stickyId, x: oldX, y: oldY});
				}
				else {
					conn.io.room(self._room).broadcast('move_sticky', { stickyId: stickyId, x: x, y: y});
				}
			});
		}
	});
};

module.exports = StickyServer;