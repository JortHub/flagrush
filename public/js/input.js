var input_ = function(callback) {
	document.addEventListener('keydown', function(event) {
		callback(event.keyCode, true);
	});
	document.addEventListener('keyup', function(event) {
		callback(event.keyCode, false);
	});
}