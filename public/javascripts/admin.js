$(document).ready(function() {
	$('table.stickies tbody tr').each(function(rowNum, tr) {
		var id = $(this).find('a').attr('href');
		id = id.slice(1, id.length);
		$(this).find('a').attr('href', '#').on('click', function() {
			$.ajax({
				url: 'api/sticky/' + id,
				type: 'DELETE',
				complete: function() {
					$(tr).remove();
				}
			});
		});
	});
	$('table.stickers tbody tr').each(function(rowNum, tr) {
		var id = $(this).find('a').attr('href');
		id = id.slice(1, id.length);
		$(this).find('a').attr('href', '#').on('click', function() {
			$.ajax({
				url: 'api/sticker/' + id,
				type: 'DELETE',
				complete: function() {
					$(tr).remove();
				}
			});
		});
	});
});