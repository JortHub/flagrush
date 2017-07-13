var gameloop_ = function(callback1, callback2) {
	var self = {};

	self.tps = 5;
	self.latestTps = 0;
	self.callback1 = callback1;
	self.callback2 = callback2;
	self.running = true;
	self.render = window.requestAnimationFrame;

	self.start = function() {
		self.render.call(window, self.update);
		self.startInterval();
	}

	self.update = function() {
		if(!self.running) {
			return;
		}

		self.callback1();
		self.render.call(window, self.update);
	}

	self.startInterval = function() {
		self.intervalid = setInterval(function() {
			self.callback2();
			if(self.tps != self.latestTps) {
				clearInterval(self.intervalid);
				self.startInterval();
			}
		}, 1000 / self.tps);
		self.latestTps = self.tps;
	}

	return self;
}