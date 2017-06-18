module.exports = {
	player: function(io, socket, name) {
		var self = {};

		// The position and rotation
		self.x = 0;
		self.y = 0;
		self.r = 0;

		// Some socket information
		self.socket = socket;
		self.io = io;

		// The name of the player
		self.name = name;

		// The team and type of the player
		self.team = 0;
		self.type = 0;

		// The current hold buttons
		self.buttons = [];

		// The force the player has
		self.forceX = 0;
		self.forceY = 0;
		self.forceR = 0;

		self.max = 100;


		self.generateLocation = function() {

		}

		self.updatePlayers = function(players) {
			for(var n in players) {
				var player = players[n];
				if((player.x - self.x <= self.max || player.x - self.x >= -self.max) && 
				   (player.y - self.y <= self.max || player.y - self.y >= -self.max)) {
					socket.emit("move", player.name, player.x, player.y, player.r);
				}
			}
		}

		self.updateMyself = function() {
			socket.emit("move", self.name, self.x, self.y, self.r);
		}

		self.hold = function(button, state) {
			self.buttons[button] = state;
		}

		self.isHold = function(button) {
			return button[button];
		}

		self.addForce = function(forceX, forceY, forceR) {
			self.forceX += forceX;
			self.forceY += forceY;
			self.forceR += forceR;

			if(self.forceX > 10) self.forceX = 10;
			if(self.forceX < -10) self.forceX = -10;

			if(self.forceY > 10) self.forceY = 10;
			if(self.forceY < -10) self.forceY = -10;

			if(self.forceR > 10) self.forceR = 10;
			if(self.forceR < -10) self.forceR = -10;
		}

		self.removeForce = function(forceX, forceY, forceR) {
			self.forceX -= forceX;
			self.forceY -= forceY;
			self.forceR -= forceR;

			if(self.forceX > 10) self.forceX = 10;
			if(self.forceX < -10) self.forceX = -10;

			if(self.forceY > 10) self.forceY = 10;
			if(self.forceY < -10) self.forceY = -10;

			if(self.forceR > 10) self.forceR = 10;
			if(self.forceR < -10) self.forceR = -10;
		}

		self.generateLocation();

		return self;
	}
}