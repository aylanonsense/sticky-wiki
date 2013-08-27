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
		this._objectLayer.removeChild(this._previews[seqNum].getRoot());
		delete this._previews[seqNum];
		this._drawSticky(stickyParams);
	};
	StickyBoard.prototype._drawSticky = function(stickyParams, isPreview) {
		var sticky =  new Sticky(stickyParams);
		this._objectLayer.appendChild(sticky.getRoot());
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
		this._refreshSVG();
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
		this._root.setAttribute('transform', 'translate(' + this._x + ', ' + this._y + ')');
		var paper = createSVG('rect', {
			x: -50,
			y: -2,
			width: 100,
			height: 100,
			fill: this._paperColor,
			stroke: 'black',
			strokeWidth: 1,
			transform: 'rotate(' + this._rotation + ' 0,0)'
		});
		this._root.appendChild(paper);
		var pin = createSVG('circle', {
			cx: 0,
			cy: 0,
			r: 5,
			fill: this._pinColor,
			stroke: 'black',
			strokeWidth: 1
		});
		this._root.appendChild(pin);
		var txt = createSVG('text', {
			x: -45,
			y: 20,
			fill: this._textColor,
			transform: 'rotate(' + this._rotation + ' 0,0)'
		}, this._text); //TODO allow text to be added
		this._root.appendChild(txt);
	};
	Sticky.prototype.getRoot = function() {
		return this._root;
	};


	return StickyBoard;
})();



//create templates
/*var defs = createSVG('defs');
this._svg.appendChild(defs);*/
/*StickyBoard.prototype._instantiateTemplate = function(template, attrs) {
	if(attrs) {
		attrs.def = template;
	}
	else {
		attrs = { def: template };
	}
	return createSVG('use', attrs);
};*/