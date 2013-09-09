var StickyBoard = (function() {
	var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
	var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
	var XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

	function createSVG(tag, attrs, text) {
		var ele = document.createElementNS(SVG_NAMESPACE, tag);
		if(typeof attrs !== 'undefined') {
			for(var key in attrs) {
				var attrName = key;
				if(attrName === 'strokeWidth') {
					attrName = 'stroke-width';
				}
				else if(attrName === 'fontSize') {
					attrName = 'font-size';
				}
				if(attrName === 'def') {
					ele.setAttributeNS(XLINK_NAMESPACE, 'href', '#' + attrs[key]);
				}
				else {
					ele.setAttributeNS(null, attrName, '' + attrs[key]);
				}
			}
		}
		if(typeof text !== 'undefined') {
			ele.appendChild(document.createTextNode(text));
		}
		return ele;
	}
	function fitTextToBox(txt, width, height, sizesToTry, horizontalJustify, verticalJustify) {
		var words = txt.firstChild.data.split(' ');
		while(txt.firstChild !== null) {
			txt.removeChild(txt.firstChild);
		}
		if(!fitTextToBoxHelper(txt, words, width, height, null, horizontalJustify, verticalJustify)) {
			for(var i = 0; i < sizesToTry.length; i++) {
				while(txt.firstChild !== null) {
					txt.removeChild(txt.firstChild);
				}
				if(fitTextToBoxHelper(txt, words, width, height, sizesToTry[i], horizontalJustify, verticalJustify)) {
					break;
				}
			}
		}
	}
	function fitTextToBoxHelper(txt, words, width, height, size, horizontalJustify, verticalJustify) {
		var tspan = createSVG('tspan', {
			x: 0
		}, words[0]);
		if(size) {
			txt.setAttributeNS(null, 'font-size', size);
		}
		var tspans = [ tspan ];
		txt.appendChild(tspan);
		var violatedWidthWithSingleWord = tspan.getComputedTextLength() > width;
		var lineHeight = 0.9 * txt.getBBox().height;
		for(var i = 1; i < words.length; i++) {
			var len = tspan.firstChild.data.length;
			tspan.firstChild.data += ' ' + words[i];
			if(tspan.getComputedTextLength() > width) {
				tspan.firstChild.data = tspan.firstChild.data.slice(0, len);
				tspan = createSVG('tspan', {
					x: 0,
					dy: lineHeight
				}, words[i]);
				tspans.push(tspan);
				txt.appendChild(tspan);
				violatedWidthWithSingleWord = violatedWidthWithSingleWord || (tspan.getComputedTextLength() > width);
			}
		}
		if(horizontalJustify === 'center') {
			tspans.forEach(function(tspan) {
				tspan.setAttributeNS(null, 'x', '' + ((width - tspan.getComputedTextLength()) / 2));
			});
		}
		else if(horizontalJustify === 'right') {
			tspans.forEach(function(tspan) {
				tspan.setAttributeNS(null, 'x', '' + (width - tspan.getComputedTextLength()));
			});
		}
		if(verticalJustify === 'center') {
			tspans[0].setAttributeNS(null, 'y', '' + ((height - txt.getBBox().height) / 2));
		}
		else if(verticalJustify === 'bottom') {
			tspans[0].setAttributeNS(null, 'y', '' + ((height - txt.getBBox().height)));
		}
		return txt.getBBox().height <= height && !violatedWidthWithSingleWord;
	}


	function StickyBoard(conn) {
		var self = this;
		this._conn = conn;
		this._svg = createSVG('svg', {
			version: '1.1',
			style: 'width: 100%; height: 100%'
		});
		this._svg.setAttributeNS(XMLNS_NAMESPACE, "xmlns:xlink", XLINK_NAMESPACE);
		this._objectLayer = createSVG('g');
		this._svg.appendChild(this._objectLayer);

		this._conn.emit('join_sticky_board');
		this._conn.on('draw_sticky', function(sticky) {
			self._drawSticky(sticky);
		});
		this._conn.on('draw_all', function(objects) {
			objects.stickies.forEach(function(sticky) {
				self._drawSticky(sticky);
			});
			objects.stickers.forEach(function(sticker) {
				self._drawSticker(sticker);
			});
		});
		this._conn.on('draw_sticker', function(sticker) {
			self._drawSticker(sticker);
		});
		this._conn.on('replace_sticky', function(data) {
			self._replaceStickyPreview(data.sticky, data.seqNum);
		});
		this._conn.on('move_sticky', function(data) {
			self._moveSticky(data.stickyId, data.x, data.y);
		});
		this._nextSequenceNum = 0;
		this._previews = {};
		this._stickies = {};
		this._stickers = {};
		this._isAddingStickers = false;
		this._stickerTypeBeingAdded = null;
	}
	StickyBoard.prototype.createSticky = function(sticky) {
		var seqNum = this._nextSequenceNum++;
		this._sendSticky(sticky, seqNum);
		this._drawStickyPreview(sticky, seqNum);
	};
	StickyBoard.prototype._sendSticky = function(sticky, seqNum) {
		this._conn.emit('create_sticky', {
			seqNum: seqNum,
			sticky: sticky
		});
	};
	StickyBoard.prototype._sendMoveSticky = function(sticky) {
		this._conn.emit('move_sticky', {
			stickyId: sticky.getId(),
			x: sticky.getX(),
			y: sticky.getY()
		});
	};
	StickyBoard.prototype._moveSticky = function(stickyId, x, y) {
		this._stickies[stickyId].moveTo(x, y);
	};
	StickyBoard.prototype._drawStickyPreview = function(stickyParams, seqNum) {
		var sticky = this._drawSticky(stickyParams, true);
		this._previews[seqNum] = sticky;
	};
	StickyBoard.prototype._replaceStickyPreview = function(stickyParams, seqNum) {
		this._previews[seqNum].removeSelf();
		delete this._previews[seqNum];
		this._drawSticky(stickyParams);
	};
	StickyBoard.prototype._drawSticky = function(stickyParams, isPreview) {
		var sticky =  new Sticky(this, stickyParams);
		sticky.appendTo(this._objectLayer);
		this._stickies[sticky.getId()] = sticky;
		return sticky;
	};
	StickyBoard.prototype._drawSticker = function(stickerParams) {
		var sticky = this._stickies[stickerParams.stickyId];
		if(sticky) {
			var sticker = new Sticker(this, stickerParams);
			sticker.appendTo(sticky.getRoot());
			this._stickers[sticker.getId()] = sticker;
			return sticker;
		}
		else {
			console.warn("Sticky " + stickerParams.stickyId + " not found for sticker " + stickerParams.id);
			return false;
		}
	};
	StickyBoard.prototype.getRoot = function() {
		return this._svg;
	};
	StickyBoard.prototype.startAddingStickers = function(type) {
		this._isAddingStickers = true;
		this._stickerTypeBeingAdded = type;
	};
	StickyBoard.prototype.stopAddingStickers = function() {
		this._isAddingStickers = false;
		this._stickerTypeBeingAdded = null;
	};
	StickyBoard.prototype._addStickerTo = function(sticky, x, y) {
		if(this._isAddingStickers) {
			this._conn.emit('create_sticker', {
				stickyId: sticky.getId(),
				type: this._stickerTypeBeingAdded,
				x: x,
				y: y
			});
		}
	};


	function Sticker(board, params) {
		this._board = board;
		this._root = createSVG('g');
		this._digestParams({
			id: -1,
			type: 'heart',
			stickerId: -1,
			x: 0,
			y: 0,
			rotation: 0
		});
		this._digestParams(params);
	}
	Sticker.prototype.getId = function() {
		return this._id;
	};
	Sticker.prototype.getX = function() {
		return this._x;
	};
	Sticker.prototype.getY = function() {
		return this._y;
	};
	Sticker.prototype.moveTo = function(x, y) {
		var parent = this._root.parentNode;
		this._x = x;
		this._y = y;
		this._root.setAttribute('transform', 'translate(' + this._x + ', ' + this._y + ')');
	};
	Sticker.prototype._digestParams = function(params) {
		if(typeof params.id !== 'undefined') this._id = params.id;
		if(typeof params.stickerId !== 'undefined') this._stickerId = params.stickerId;
		if(typeof params.type !== 'undefined') this._type = params.type;
		if(typeof params.x !== 'undefined') this._x = params.x;
		if(typeof params.y !== 'undefined') this._y = params.y;
		if(typeof params.rotation !== 'undefined') this._rotation = params.rotation;
	};
	Sticker.prototype._refreshSVG = function() {
		this._root.setAttribute('transform', 'translate(' + this._x + ', ' + this._y + ')');
		if(this._type === 'heart') {
			var square = createSVG('rect', {
				x: -10,
				y: -10,
				width: 20,
				height: 20,
				fill: '#f00',
				stroke: '#000',
				strokeWidth: 1,
				transform: 'rotate(' + this._rotation + ' 0,0)'
			});
			this._root.appendChild(square);
		}
		else {
			var square = createSVG('rect', {
				x: -10,
				y: -10,
				width: 20,
				height: 20,
				fill: '#00f',
				stroke: '#000',
				strokeWidth: 1,
				transform: 'rotate(' + this._rotation + ' 0,0)'
			});
			this._root.appendChild(square);
		}
		/*var paperColor;
		switch(this._paperColor) {
			case 'pink': paperColor = '#f5d4f5'; break;
			case 'green': paperColor = '#ddf8e2'; break;
			case 'blue': paperColor = '#d4edf5'; break;
			case 'orange': paperColor = '#f8e3cc'; break;
			default: paperColor = '#fdfbd5'; break;
		}
		var inkColor;
		switch(this._textColor) {
			case 'red': inkColor = '#c71227'; break;
			case 'blue': inkColor = '#1925ac'; break;
			default: inkColor = '#222222'; break;
		}
		var pinColor;
		switch(this._pinColor) {
			case 'green': pinColor = "#1bc530"; break;
			case 'yellow': pinColor = "#e0d228"; break;
			case 'blue': pinColor = "#4f6eec"; break;
			default: pinColor = "#f0593d"; break;
		}
		this._root.setAttribute('transform', 'translate(' + this._x + ', ' + this._y + ')');
		var paper = createSVG('rect', {
			x: -50,
			y: -2,
			width: 100,
			height: 100,
			fill: paperColor,
			stroke: 'black',
			strokeWidth: 1,
			transform: 'rotate(' + this._rotation + ' 0,0)'
		});
		this._root.appendChild(paper);
		var g = createSVG('g', {
			transform: 'rotate(' + this._rotation + ' 0,0),translate(-45,15)'
		});
		this._root.appendChild(g);
		var txt = createSVG('text', {
			y: 5,
			fill: inkColor,
			fontSize: '12pt'
		}, this._text);
		g.appendChild(txt);
		fitTextToBox(txt, 90, 90, [ '10pt', '8pt', '6pt', '4pt' ], 'center', 'center');
		var pin = createSVG('circle', {
			cx: 0,
			cy: 0,
			r: 5,
			fill: pinColor,
			stroke: 'black',
			strokeWidth: 1
		});
		this._root.appendChild(pin);
		var dragArea = createSVG('rect', {
			x: -50,
			y: -2,
			width: 100,
			height: 100,
			fill: '#ff00ff',
			'fill-opacity': 0.0000001, //some browsers don't register clicks if this is 0
			stroke: 'none',
			transform: 'rotate(' + this._rotation + ' 0,0)'
		});
		var self = this;
		$(dragArea).on('mousedown', function(evt) {
			self._root.parentNode.appendChild(self._root);
			var stickyStartingPos = { x: self._x, y: self._y };
			var start = { x: evt.pageX, y: evt.pageY };
			function moveSticky(evt) {
				var end = { x: evt.pageX, y: evt.pageY };
				self._x = stickyStartingPos.x + end.x - start.x;
				self._y = stickyStartingPos.y + end.y - start.y;
				self._root.setAttribute('transform', 'translate(' + self._x + ', ' + self._y + ')');
			}
			function stopMovingSticky(evt) {
				var end = { x: evt.pageX, y: evt.pageY };
				self._x = stickyStartingPos.x + end.x - start.x;
				self._y = stickyStartingPos.y + end.y - start.y;
				self._root.setAttribute('transform', 'translate(' + self._x + ', ' + self._y + ')');
				this.setAttributeNS(null, 'x', -50);
				this.setAttributeNS(null, 'y', -2);
				this.setAttributeNS(null, 'width', 100);
				this.setAttributeNS(null, 'height', 100);
				$(this).off('mousemove', moveSticky);
				$(this).off('mouseup', stopMovingSticky);
				self._board._sendMoveSticky(self); //cheating! cheating!
			}
			this.setAttributeNS(null, 'x', -1000);
			this.setAttributeNS(null, 'y', -952);
			this.setAttributeNS(null, 'width', 2000);
			this.setAttributeNS(null, 'height', 2000);
			$(this).on('mousemove', moveSticky);
			$(this).on('mouseup', stopMovingSticky);
		});
		this._root.appendChild(dragArea);*/
	};
	Sticker.prototype.getRoot = function() {
		return this._root;
	};
	Sticker.prototype.appendTo = function(element) {
		element.appendChild(this._root);
		this._refreshSVG();
	};
	Sticker.prototype.removeSelf = function() {
		this._root.parentNode.removeChild(this._root);
	};


	function Sticky(board, params) {
		this._board = board;
		this._root = createSVG('g');
		this._digestParams({
			id: -1,
			text: '',
			x: 0,
			y: 0,
			textColor: 'black',
			pinColor: 'red',
			paperColor: 'yellow',
			rotation: 0
		});
		this._digestParams(params);
	}
	Sticky.prototype.getId = function() {
		return this._id;
	};
	Sticky.prototype.getX = function() {
		return this._x;
	};
	Sticky.prototype.getY = function() {
		return this._y;
	};
	Sticky.prototype.moveTo = function(x, y) {
		var parent = this._root.parentNode;
		this._x = x;
		this._y = y;
		this._root.setAttribute('transform', 'translate(' + this._x + ', ' + this._y + ')');
	};
	Sticky.prototype._digestParams = function(params) {
		if(typeof params.id !== 'undefined') this._id = params.id;
		if(typeof params.text !== 'undefined') this._text = params.text;
		if(typeof params.x !== 'undefined') this._x = params.x;
		if(typeof params.y !== 'undefined') this._y = params.y;
		if(typeof params.textColor !== 'undefined') this._textColor = params.textColor;
		if(typeof params.pinColor !== 'undefined') this._pinColor = params.pinColor;
		if(typeof params.paperColor !== 'undefined') this._paperColor = params.paperColor;
		if(typeof params.rotation !== 'undefined') this._rotation = params.rotation;
	};
	Sticky.prototype._refreshSVG = function() {
		var paperColor;
		switch(this._paperColor) {
			case 'pink': paperColor = '#f5d4f5'; break;
			case 'green': paperColor = '#ddf8e2'; break;
			case 'blue': paperColor = '#d4edf5'; break;
			case 'orange': paperColor = '#f8e3cc'; break;
			default: paperColor = '#fdfbd5'; break;
		}
		var inkColor;
		switch(this._textColor) {
			case 'red': inkColor = '#c71227'; break;
			case 'blue': inkColor = '#1925ac'; break;
			default: inkColor = '#222222'; break;
		}
		var pinColor;
		switch(this._pinColor) {
			case 'green': pinColor = "#1bc530"; break;
			case 'yellow': pinColor = "#e0d228"; break;
			case 'blue': pinColor = "#4f6eec"; break;
			default: pinColor = "#f0593d"; break;
		}
		this._root.setAttribute('transform', 'translate(' + this._x + ', ' + this._y + ')');
		var paper = createSVG('rect', {
			x: -50,
			y: -2,
			width: 100,
			height: 100,
			fill: paperColor,
			stroke: 'black',
			strokeWidth: 1,
			transform: 'rotate(' + this._rotation + ' 0,0)'
		});
		this._root.appendChild(paper);
		var g = createSVG('g', {
			transform: 'rotate(' + this._rotation + ' 0,0),translate(-45,15)'
		});
		this._root.appendChild(g);
		var txt = createSVG('text', {
			y: 5,
			fill: inkColor,
			fontSize: '12pt'
		}, this._text);
		g.appendChild(txt);
		fitTextToBox(txt, 90, 90, [ '10pt', '8pt', '6pt', '4pt' ], 'center', 'center');
		var pin = createSVG('circle', {
			cx: 0,
			cy: 0,
			r: 5,
			fill: pinColor,
			stroke: 'black',
			strokeWidth: 1
		});
		this._root.appendChild(pin);
		var dragArea = createSVG('rect', {
			x: -50,
			y: -2,
			width: 100,
			height: 100,
			fill: '#ff00ff',
			'fill-opacity': 0.0000001, //some browsers don't register clicks if this is 0
			stroke: 'none',
			transform: 'rotate(' + this._rotation + ' 0,0)'
		});
		var self = this;
		$(dragArea).on('mousedown', function(evt) {
			self._root.parentNode.appendChild(self._root);
			var stickyStartingPos = { x: self._x, y: self._y };
			var start = { x: evt.pageX, y: evt.pageY };
			var startTime = Date.now();
			function moveSticky(evt) {
				var end = { x: evt.pageX, y: evt.pageY };
				self._x = stickyStartingPos.x + end.x - start.x;
				self._y = stickyStartingPos.y + end.y - start.y;
				self._root.setAttribute('transform', 'translate(' + self._x + ', ' + self._y + ')');
			}
			function stopMovingSticky(evt) {
				var end = { x: evt.pageX, y: evt.pageY };
				var endTime = Date.now();
				self._x = stickyStartingPos.x + end.x - start.x;
				self._y = stickyStartingPos.y + end.y - start.y;
				self._root.setAttribute('transform', 'translate(' + self._x + ', ' + self._y + ')');
				this.setAttributeNS(null, 'x', -50);
				this.setAttributeNS(null, 'y', -2);
				this.setAttributeNS(null, 'width', 100);
				this.setAttributeNS(null, 'height', 100);
				$(this).off('mousemove', moveSticky);
				$(this).off('mouseup', stopMovingSticky);
				if(Math.sqrt((end.x - start.x) * (end.x - start.x) + (end.y - start.y) * (end.y - start.y)) < 5 && (endTime - startTime < 1000)) {
					self._x = stickyStartingPos.x;
					self._y = stickyStartingPos.y;
					self._root.setAttribute('transform', 'translate(' + self._x + ', ' + self._y + ')');
					self._board._addStickerTo(self, end.x - self._x - 200, end.y - self._y); //cheating! cheating!
				}
				else {
					self._board._sendMoveSticky(self); //cheating! cheating!
				}
			}
			this.setAttributeNS(null, 'x', -1000);
			this.setAttributeNS(null, 'y', -952);
			this.setAttributeNS(null, 'width', 2000);
			this.setAttributeNS(null, 'height', 2000);
			$(this).on('mousemove', moveSticky);
			$(this).on('mouseup', stopMovingSticky);
		});
		this._root.appendChild(dragArea);
	};
	Sticky.prototype.getRoot = function() {
		return this._root;
	};
	Sticky.prototype.appendTo = function(element) {
		element.appendChild(this._root);
		this._refreshSVG();
	};
	Sticky.prototype.removeSelf = function() {
		this._root.parentNode.removeChild(this._root);
	};


	return StickyBoard;
})();