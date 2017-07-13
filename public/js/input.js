var input_ = function() {
	var self = {};

	self.square = document.getElementById('game-map');

	document.addEventListener('keydown', function(event) {
		if(server != null && started) {
			if(event.keyCode == 49) {
				open_minimap();
			}
			else if(event.keyCode == 50) {
				open_leaderboard();
			}
			else if(event.keyCode == 51) {
				open_settings();
			}
			else if(event.keyCode == 52) {
				open_exit();
			}
			else {
				server.emit("input", event.keyCode, true);
			}
			
		}
	});

	document.addEventListener('keyup', function(event) {
		if(server != null && started) {
			server.emit("input", event.keyCode, false);
		}
	});

	document.addEventListener('mousedown', function(event) {
		if(server != null && started) {
			server.emit("input", -event.button - 1, true);
		}
	});

	document.addEventListener('contextmenu', function(event) {
		if(server != null && started) {
			event.preventDefault();
		}
	});

	document.addEventListener('mouseup', function(event) {
		if(server != null && started) {
			server.emit("input", -event.button - 1, false);
		}
	});

	self.square.addEventListener('mouseup', function(event) {
		event.stopPropagation();
	});

	self.square.addEventListener('mousedown', function(event) {
		event.stopPropagation();
	});

	return self;
}