var input_ = function() {
	var self = {};

	self.square = document.getElementById('game-map');
	self.upgrades = document.getElementById('game-upgrades');
	self.spaceDown = false;
	self.shiftDown = false;
	self.wDown = false;
	self.aDown = false;
	self.sDown = false;
	self.dDown = false;

	document.addEventListener('keydown', function(event) {
		if(server != null && started) {
			if(use_mouse) {
				if(event.keyCode == 32 && !self.spaceDown) {
					server.emit("input", event.keyCode, true);
					self.spaceDown = true;
				}
				else if(event.keyCode == 16 && !self.shiftDown) {
					server.emit("input", event.keyCode, true);
					self.shiftDown = true;
				}
			}
			else {
				if(event.keyCode == 49) {
					open_minimap();
				}
				else if(event.keyCode == 50) {
					open_leaderboard();
				}
				else if(event.keyCode == 51) {
					open_settings();
				}
				else if(event.keyCode == 87 && !self.wDown) {
					server.emit("input", event.keyCode, true);
					self.wDown = true;
				}
				else if(event.keyCode == 65 && !self.aDown) {
					server.emit("input", event.keyCode, true);
					self.aDown = true;
				}
				else if(event.keyCode == 83 && !self.sDown) {
					server.emit("input", event.keyCode, true);
					self.sDown = true;
				}
				else if(event.keyCode == 68 && !self.dDown) {
					server.emit("input", event.keyCode, true);
					self.dDown = true;
				}
			}
		}
	});

	document.addEventListener('mousemove', function(event) {
		mouseInScreen = true;
		mouseX = event.pageX;
		mouseY = event.pageY;
	});

	document.addEventListener('keyup', function(event) {
		if(server != null && started) {
			if(use_mouse) {
				if(event.keyCode == 32 && self.spaceDown) {
					server.emit("input", event.keyCode, false);
					self.spaceDown = false;
				}
				else if(event.keyCode == 16 && self.shiftDown) {
					server.emit("input", event.keyCode, false);
					self.shiftDown = false;
				}
			}
			else {
				if(event.keyCode == 87 && self.wDown) {
					server.emit("input", event.keyCode, false);
					self.wDown = false;
				}
				else if(event.keyCode == 65 && self.aDown) {
					server.emit("input", event.keyCode, false);
					self.aDown = false;
				}
				else if(event.keyCode == 83 && self.sDown) {
					server.emit("input", event.keyCode, false);
					self.sDown = false;
				}
				else if(event.keyCode == 68 && self.dDown) {
					server.emit("input", event.keyCode, false);
					self.dDown = false;
				}
			}
		}
	});

	document.addEventListener('mousedown', function(event) {
		if(server != null && started) {
			server.emit("input", -event.button - 1, true);
		}
	});

	window.addEventListener('mousewheel', function(event) {
		if(server != null && started) {
			if(event.deltaY > 0) {
				open_next();
			}
			else if(event.deltaY < 0) {
				open_previous();
			}
		}
	});

	document.addEventListener('mouseout', function(event) {
		mouseInScreen = false;
	});

	document.addEventListener('mouseenter', function(event) {
		mouseInScreen = true;
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

	self.stop = function(event) {
		event.stopPropagation();
	}

	self.square.addEventListener('mouseup', self.stop);

	self.square.addEventListener('mousedown', self.stop);

	self.upgrades.addEventListener('mouseup', self.stop);

	self.upgrades.addEventListener('mousedown', self.stop);

	return self;
}