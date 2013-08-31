var models = require('./models');
var Sticky = models.Sticky;

function StickyServer() {
	this._room = 'sticky_board_' + (this.NEXT_ROOM_ID++);
	this._nextClientId = 1;
}
StickyServer.prototype.NEXT_ROOM_ID = 1;
StickyServer.prototype.addConnection = function(conn) {
	var self = this;
	var clientId = this._nextClientId++;
	conn.io.join(this._room);
	this._sendAllStickies(conn);
	conn.socket.on('create_sticky', function(data) {
		self._handleStickyCreateRequest(conn, data.seqNum, data.sticky);
	});
	conn.socket.on('move_sticky', function(data) {
		self._handleStickyMoveRequest(conn, data.stickyId, data.x, data.y);
	});
	conn.socket.on('disconnect', function() {
		console.log("Client " + clientId + " disconnected!");
	});
	console.log("Client " + clientId + " connected!");
};
StickyServer.prototype._sendAllStickies = function(conn) {
	Sticky.find(function(err, stickyRecords) {
		if(err) {
			console.log("Error retrieving all stickies:", err);
		}
		else {
			var stickies = [];
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
			conn.io.emit('draw_stickies', stickies); //TODO sort by last modified
		}
	});
};
StickyServer.prototype._handleStickyCreateRequest = function(conn, seqNum, sticky) {
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
		rotation: sticky.rotation
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
StickyServer.prototype._handleStickyMoveRequest = function(conn, stickyId, x, y) {
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