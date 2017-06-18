var input = function(callback) {
	document.addEventListener('keydown', function(event) {
		callback(event.charCode, true);
	});
	document.addEventListener('keyup', function(event) {
		callback(event.charCode, false);
	});
}