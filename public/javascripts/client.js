$(document).ready(function() {
	var board = new StickyBoard(io.connect());
	$(board.getRoot()).appendTo($('#canvas'));
	setInterval(function() {
		board.createSticky({
			text: "Hello",
			x: 100 + Math.floor(300 * Math.random()),
			y: 100 + Math.floor(300 * Math.random()),
			textColor: "white",
			pinColor: "green",
			paperColor: "black"
		});
	}, 1000);
});