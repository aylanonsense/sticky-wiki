var StickyClient = (function() {
	function StickyClient() {
		this._socket = null;
	}
	StickyClient.prototype.connect = function() {
		this._socket = io.connect();
		this._socket.emit('JOIN_GAME');
	};
	StickyClient.prototype.sendRequest = function(req) {

	};
	StickyClient.prototype.on = function(messageType, callback) {

	};

	return StickyClient;
})();