$(document).ready(function() {
	var canvas = $("#canvas");
	var form = $("#menu form");
	var textField = $("#sticky-message");
	var textColorDropDown = $("#sticky-text-color");
	var paperColorDropDown = $("#sticky-paper-color");
	var pinColorDropDown = $("#sticky-pin-color");
	var createStickyButton = $("#sticky-create");

	var board = new StickyBoard(io.connect());
	$(board.getRoot()).appendTo(canvas);

	form.on('submit', function() {
		createSticky();
		return false;
	});
	textField.on('keypress', function(evt) {
		if(evt.which === 13) {
			createSticky();
			setTimeout(function() {
				textField.val("");
			}, 0);
		}
	})

	function createSticky() {
		if(textField.val().trim() !== "") {
			board.createSticky({
				text: textField.val(),
				x: Math.floor(20 + (canvas.width() - 40) * Math.random()),
				y: Math.floor(5 + (canvas.height() - 80) * Math.random()),
				textColor: textColorDropDown.val(),
				pinColor: pinColorDropDown.val(),
				paperColor: paperColorDropDown.val()
			});
			textField.val("");
		}
	}
});