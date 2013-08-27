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
	conn.socket.on('disconnect', function() {
		console.log("Client " + clientId + " disconnected!");
	});
	console.log("Client " + clientId + " connected!");
};
StickyServer.prototype._sendAllStickies = function(conn) {
	conn.io.emit('draw_stickies', []);
};
StickyServer.prototype._handleStickyCreateRequest = function(conn, seqNum, sticky) {
	sticky = {
		id: 0,
		text: sticky.text,
		x: sticky.x,
		y: sticky.y,
		textColor: sticky.textColor,
		pinColor: sticky.pinColor,
		paperColor: sticky.paperColor,
		rotation: Math.round(30 * Math.random() - 15)
	};
	//send sticky to all clients
	conn.io.emit('replace_sticky', { seqNum: seqNum, sticky: sticky });
	conn.io.room(this._room).broadcast('draw_sticky', sticky);
};

module.exports = StickyServer;