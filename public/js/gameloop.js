var gameloop = function(callback) {
	var self = {};

	self.callback = callback || function(){};
	self.running = true;
	self.render = window.requestAnimationFrame;

	self.start = function() {
		self.render.call(window, self.update);
	}

	self.update = function() {
		if(!self.running) {
			return;
		}

		callback();
		self.render.call(window, self.update);
	}

	return self;
}