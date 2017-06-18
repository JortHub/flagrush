module.exports = {
	gameloop: function(callback) {
		var gameloop = require("node-gameloop");
		var self = {};
		
		self.running = true;
		self.tickLengthMs = 1000 / 20;

		self.loop = function(delta) {
			if(!self.running) {
				self.gameloop.clearGameLoop(self.id);
				return;
			}

			callback();
		}

		self.id = gameloop.setGameLoop(self.loop, self.tickLengthMs);

		return self;
	}
}