$(document).ready(function() {
	var canvas = $("#canvas");
	var textField = $("#sticky-message");
	var textColorDropDown = $("#sticky-text-color");
	var paperColorDropDown = $("#sticky-paper-color");
	var pinColorDropDown = $("#sticky-pin-color");
	var createStickyButton = $("#sticky-create");

	var board = new StickyBoard(io.connect());
	$(board.getRoot()).appendTo(canvas);

	createStickyButton.on('click', function(evt) {
		board.createSticky({
			text: textField.val(),
			x: Math.floor(20 + (canvas.width() - 40) * Math.random()),
			y: Math.floor(5 + (canvas.height() - 80) * Math.random()),
			textColor: textColorDropDown.val(),
			pinColor: pinColorDropDown.val(),
			paperColor: paperColorDropDown.val()
		});
		textField.val("");
		evt.preventDefault();
	});
});