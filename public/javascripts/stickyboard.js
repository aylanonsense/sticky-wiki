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
	function fitTextToBox(txt, width, height, sizesToTry, horizontalJustify) {
		var words = txt.firstChild.data.split(' ');
		txt.firstChild.data = '';
		var tspan = createSVG('tspan', {
			x: 0
		}, words[0]);
		var tspans = [ tspan ];
		txt.appendChild(tspan);
		for(var i = 1; i < words.length; i++) {
			var len = tspan.firstChild.data.length;
			tspan.firstChild.data += ' ' + words[i];
			if(tspan.getComputedTextLength() > width) {
				tspan.firstChild.data = tspan.firstChild.data.slice(0, len);
				tspan = createSVG('tspan', {
					x: 0,
					dy: 12
				}, words[i]);
				tspans.push(tspan);
				txt.appendChild(tspan);
			}
		}
		if(horizontalJustify === 'center') {
			tspans.forEach(function(tspan) {
				tspan.setAttributeNS(null, 'x', '' + ((width - tspan.getComputedTextLength()) / 2));
			});
		}
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
		this._conn.on('draw_stickies', function(stickies) {
			stickies.forEach(function(sticky) {
				self._drawSticky(sticky);
			});
		});
		this._conn.on('replace_sticky', function(data) {
			self._replaceStickyPreview(data.sticky, data.seqNum);
		});
		this._nextSequenceNum = 0;
		this._previews = {};
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
		var sticky =  new Sticky(stickyParams);
		sticky.appendTo(this._objectLayer);
		return sticky;
	};
	StickyBoard.prototype.getRoot = function() {
		return this._svg;
	};


	function Sticky(params) {
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
			fill: inkColor,
			fontSize: '12pt'
		}, this._text);
		g.appendChild(txt);
		fitTextToBox(txt, 90, 80, [ '10pt', '8pt' ], 'center');
		var pin = createSVG('circle', {
			cx: 0,
			cy: 0,
			r: 5,
			fill: this._pinColor,
			stroke: 'black',
			strokeWidth: 1
		});
		this._root.appendChild(pin);
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